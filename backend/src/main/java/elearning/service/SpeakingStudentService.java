package elearning.service;

import elearning.dto.SpeakingDto.SpeakingResponse;
import elearning.dto.SpeakingDto.SpeakingSubmissionResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.SpeakingActivity;
import elearning.entity.SpeakingSubmission;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.SpeakingActivityRepository;
import elearning.repository.SpeakingSubmissionRepository;
import elearning.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@Transactional
public class SpeakingStudentService {
    private static final Logger log = LoggerFactory.getLogger(SpeakingStudentService.class);
    private static final long MAX_RECORDING_BYTES = 20L * 1024L * 1024L;

    private final SpeakingActivityRepository activities;
    private final SpeakingSubmissionRepository submissions;
    private final UserRepository users;
    private final ClassEnrollmentRepository enrollments;
    private final MediaStorageService media;
    private final LessonService lessonService;

    public SpeakingStudentService(
            SpeakingActivityRepository activities,
            SpeakingSubmissionRepository submissions,
            UserRepository users,
            ClassEnrollmentRepository enrollments,
            MediaStorageService media,
            LessonService lessonService) {
        this.activities = activities;
        this.submissions = submissions;
        this.users = users;
        this.enrollments = enrollments;
        this.media = media;
        this.lessonService = lessonService;
    }

    @Transactional(readOnly = true)
    public SpeakingResponse get(String email, Long id) {
        User student = student(email);
        SpeakingActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        return new SpeakingResponse(
                activity.getId(),
                activity.getCourseWeek().getId(),
                activity.getLesson() == null ? null : activity.getLesson().getId(),
                activity.getTitle(),
                activity.getInstruction(),
                activity.getPromptText(),
                activity.getStatus().name(),
                false,
                0,
                0);
    }

    @Transactional(readOnly = true)
    public SpeakingSubmissionResponse submission(String email, Long activityId) {
        User student = student(email);
        SpeakingActivity activity = publishedActivity(activityId);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        return submissions
                .findByActivityIdAndStudentId(activityId, student.getId())
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public SubmissionAudio submissionAudio(String email, Long submissionId) {
        User student = student(email);
        SpeakingSubmission submission =
                submissions
                        .findById(submissionId)
                        .filter(item -> item.getStudent().getId().equals(student.getId()))
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Không tìm thấy bài ghi âm của bạn"));
        requireEnrollment(student, submission.getActivity());
        Resource resource = media.load(submission.getRecordingUrl());
        MediaType type;
        try {
            type = MediaType.parseMediaType(media.contentType(submission.getRecordingUrl()));
        } catch (Exception ex) {
            type = MediaType.APPLICATION_OCTET_STREAM;
        }
        return new SubmissionAudio(resource, type);
    }

    public SpeakingSubmissionResponse submit(String email, Long id, MultipartFile audio)
            throws IOException {
        User student = student(email);
        SpeakingActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);

        validateAudio(audio);
        SpeakingSubmission submission =
                submissions
                        .findByActivityIdAndStudentId(id, student.getId())
                        .orElseGet(SpeakingSubmission::new);
        if (submission.getId() != null && submission.getStatus() == SpeakingSubmission.Status.GRADED) {
            throw new IllegalArgumentException(
                    "Bài Speaking đã được giáo viên chấm nên không thể nộp lại");
        }

        log.info(
                "Speaking upload started: activityId={}, studentId={}, name={}, size={}, type={}",
                id,
                student.getId(),
                audio.getOriginalFilename(),
                audio.getSize(),
                audio.getContentType());

        String recordingUrl = media.store(audio, "speaking");

        submission.setActivity(activity);
        submission.setStudent(student);
        submission.setRecordingUrl(recordingUrl);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setStatus(SpeakingSubmission.Status.SUBMITTED);
        submission.setScore(null);
        submission.setFeedback(null);
        submission.setGradedAt(null);
        submission.setGradedBy(null);

        SpeakingSubmission saved = submissions.saveAndFlush(submission);
        log.info(
                "Speaking upload saved: submissionId={}, activityId={}, studentId={}, url={}",
                saved.getId(),
                id,
                student.getId(),
                recordingUrl);
        lessonService.autoComplete(student, activity.getLesson());
        return toResponse(saved);
    }

    private void validateAudio(MultipartFile audio) {
        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException("Bạn chưa ghi âm bài nói");
        }
        if (audio.getSize() > MAX_RECORDING_BYTES) {
            throw new IllegalArgumentException(
                    "Bản ghi âm vượt quá 20 MB. Vui lòng ghi ngắn hơn rồi nộp lại");
        }
    }

    private SpeakingActivity publishedActivity(Long id) {
        return activities
                .findById(id)
                .filter(activity -> activity.getStatus() == SpeakingActivity.Status.PUBLISHED)
                .filter(activity -> activity.getCourseWeek() != null
                        && activity.getCourseWeek().getStatus() == elearning.entity.CourseWeek.Status.PUBLISHED
                        && activity.getCourseWeek().getCourse().getStatus() == elearning.entity.Course.Status.PUBLISHED)
                .filter(activity -> activity.getLesson() == null
                        || activity.getLesson().getStatus() == elearning.entity.Lesson.Status.PUBLISHED)
                .orElseThrow(
                        () ->
                                new elearning.exception.ContentNotFoundException(
                                        "Không tìm thấy bài Speaking hoặc bài chưa được mở cho học"
                                                + " viên"));
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        user ->
                                user.getRole() == UserRole.STUDENT
                                        && user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Không tìm thấy học viên đang hoạt động"));
    }


    private void requireLessonAccess(User student, SpeakingActivity activity) {
        if (activity.getLesson() != null) {
            lessonService.requireStudentAccess(student, activity.getLesson());
        }
    }

    private void requireEnrollment(User student, SpeakingActivity activity) {
        Long courseId = activity.getCourseWeek().getCourse().getId();
        boolean enrolled =
                enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                        student.getId(), courseId, ClassEnrollment.Status.ACTIVE);
        if (!enrolled) {
            throw elearning.exception.LearningAccessException.notEnrolled(
                    "Bạn cần tham gia một lớp của khóa học trước khi làm bài Speaking", courseId);
        }
    }

    private SpeakingSubmissionResponse toResponse(SpeakingSubmission submission) {
        return new SpeakingSubmissionResponse(
                submission.getId(),
                submission.getStudent().getId(),
                submission.getStudent().getFullName(),
                submission.getRecordingUrl(),
                submission.getStatus().name(),
                submission.getScore(),
                submission.getFeedback(),
                submission.getSubmittedAt(),
                submission.getGradedAt());
    }

    public record SubmissionAudio(Resource resource, MediaType contentType) {}
}
