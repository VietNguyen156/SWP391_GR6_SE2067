package elearning.controller;

import elearning.dto.SpeakingDto.SpeakingRequest;
import elearning.dto.SpeakingDto.SpeakingResponse;
import elearning.dto.SpeakingDto.SpeakingSubmissionResponse;
import elearning.entity.Lesson;
import elearning.entity.SpeakingActivity;
import elearning.entity.SpeakingSubmission;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.LessonRepository;
import elearning.repository.SpeakingActivityRepository;
import elearning.repository.SpeakingSubmissionRepository;
import elearning.repository.UserRepository;
import elearning.service.MediaStorageService;

import jakarta.validation.Valid;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/speaking")
@PreAuthorize("hasRole('TEACHER')")
@Transactional
public class SpeakingTeacherController {
    private final SpeakingActivityRepository acts;
    private final SpeakingSubmissionRepository subs;
    private final UserRepository users;
    private final elearning.repository.CourseWeekRepository weeks;
    private final MediaStorageService media;
    private final LessonRepository lessons;

    public SpeakingTeacherController(
            SpeakingActivityRepository a,
            SpeakingSubmissionRepository s,
            UserRepository u,
            elearning.repository.CourseWeekRepository w,
            MediaStorageService m,
            LessonRepository l) {
        acts = a;
        subs = s;
        users = u;
        weeks = w;
        media = m;
        lessons = l;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SpeakingResponse> list(Principal p) {
        Long tid = teacher(p.getName()).getId();
        return acts.findAll().stream()
                .filter(x -> x.getTeacher().getId().equals(tid))
                .sorted(Comparator.comparing(SpeakingActivity::getUpdatedAt).reversed())
                .map(this::resp)
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public SpeakingResponse get(Principal p, @PathVariable Long id) {
        return resp(owned(id, teacher(p.getName()).getId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpeakingResponse create(Principal p, @Valid @RequestBody SpeakingRequest r) {
        User t = teacher(p.getName());
        SpeakingActivity a = new SpeakingActivity();
        a.setTeacher(t);
        apply(a, r, t.getId());
        return resp(acts.save(a));
    }

    @PutMapping("/{id}")
    public SpeakingResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody SpeakingRequest r) {
        User t = teacher(p.getName());
        SpeakingActivity a = owned(id, t.getId());
        if (subs.existsByActivityId(id)) {
            throw new IllegalArgumentException(
                    "Bài Speaking đã có học viên nộp. Không thể sửa nội dung để bảo toàn bài làm; hãy tạo bài mới nếu cần thay đổi.");
        }
        apply(a, r, t.getId());
        return resp(acts.save(a));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        SpeakingActivity activity = owned(id, teacher(p.getName()).getId());
        if (subs.existsByActivityId(id)) {
            throw new IllegalArgumentException(
                    "Bài Speaking đã có học viên nộp nên không thể xóa. Hãy giữ bài để bảo toàn lịch sử chấm.");
        }
        acts.delete(activity);
    }

    @GetMapping("/{id}/submissions")
    @Transactional(readOnly = true)
    public List<SpeakingSubmissionResponse> submissions(Principal p, @PathVariable Long id) {
        SpeakingActivity a = owned(id, teacher(p.getName()).getId());
        return subs.findAllByActivityIdOrderBySubmittedAtDesc(a.getId()).stream()
                .map(this::sub)
                .toList();
    }

    @GetMapping("/submissions/{submissionId}/audio")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> audio(Principal p, @PathVariable Long submissionId) {
        User t = teacher(p.getName());
        SpeakingSubmission s =
                subs.findById(submissionId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài nộp"));
        owned(s.getActivity().getId(), t.getId());
        Resource resource = media.load(s.getRecordingUrl());
        MediaType type;
        try {
            type = MediaType.parseMediaType(media.contentType(s.getRecordingUrl()));
        } catch (Exception ex) {
            type = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok().contentType(type).body(resource);
    }

    @PutMapping("/submissions/{submissionId}/grade")
    public SpeakingSubmissionResponse grade(
            Principal p, @PathVariable Long submissionId, @Valid @RequestBody GradeRequest r) {
        User t = teacher(p.getName());
        SpeakingSubmission s =
                subs.findById(submissionId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài nộp"));
        owned(s.getActivity().getId(), t.getId());
        s.setScore(r.score());
        s.setFeedback(r.feedback() == null || r.feedback().isBlank() ? null : r.feedback().trim());
        s.setStatus(SpeakingSubmission.Status.GRADED);
        s.setGradedBy(t);
        s.setGradedAt(java.time.LocalDateTime.now());
        return sub(subs.save(s));
    }

    private void apply(SpeakingActivity a, SpeakingRequest r, Long tid) {
        a.setCourseWeek(
                weeks.findById(r.courseWeekId())
                        .filter(w -> w.getCourse().getCreatedByTeacher().getId().equals(tid))
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Tuần học không thuộc khóa học của giáo viên")));
        a.setLesson(lesson(r.lessonId(), r.courseWeekId(), tid));
        a.setTitle(r.title().trim());
        a.setInstruction(r.instruction().trim());
        a.setPromptText(r.promptText() == null ? null : r.promptText().trim());
        // Ẩn/hiện chỉ còn ở khóa học và tuần; bài và học liệu luôn hiển thị.
        a.setStatus(SpeakingActivity.Status.PUBLISHED);
    }

    private Lesson lesson(Long lessonId, Long weekId, Long teacherId) {
        if (lessonId == null) {
            throw new IllegalArgumentException("Vui lòng chọn bài học trước khi tạo bài Speaking");
        }
        Lesson lesson =
                lessons.findByIdAndCreatedByTeacherId(lessonId, teacherId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        if (lesson.getCourseWeek() == null || !lesson.getCourseWeek().getId().equals(weekId)) {
            throw new IllegalArgumentException("Bài học không thuộc tuần đã chọn");
        }
        return lesson;
    }

    private SpeakingActivity owned(Long id, Long tid) {
        return acts.findById(id)
                .filter(x -> x.getTeacher().getId().equals(tid))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài Speaking"));
    }

    private User teacher(String e) {
        return users.findByEmailIgnoreCase(e)
                .filter(x -> x.getRole() == UserRole.TEACHER && x.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giáo viên"));
    }

    private SpeakingResponse resp(SpeakingActivity a) {
        return new SpeakingResponse(
                a.getId(),
                a.getCourseWeek().getId(),
                a.getLesson() == null ? null : a.getLesson().getId(),
                a.getTitle(),
                a.getInstruction(),
                a.getPromptText(),
                a.getStatus().name(),
                a.getId() != null && subs.existsByActivityId(a.getId()),
                a.getId() == null ? 0 : subs.countByActivityId(a.getId()),
                a.getId() == null
                        ? 0
                        : subs.countByActivityIdAndStatus(
                                a.getId(), SpeakingSubmission.Status.SUBMITTED));
    }

    private SpeakingSubmissionResponse sub(SpeakingSubmission s) {
        return new SpeakingSubmissionResponse(
                s.getId(),
                s.getStudent().getId(),
                s.getStudent().getFullName(),
                s.getRecordingUrl(),
                s.getStatus().name(),
                s.getScore(),
                s.getFeedback(),
                s.getSubmittedAt(),
                s.getGradedAt());
    }

    public record GradeRequest(
            @jakarta.validation.constraints.NotNull
                    @jakarta.validation.constraints.DecimalMin("0.00")
                    @jakarta.validation.constraints.DecimalMax("100.00")
                    java.math.BigDecimal score,
            @jakarta.validation.constraints.Size(max = 65535) String feedback) {}
}
