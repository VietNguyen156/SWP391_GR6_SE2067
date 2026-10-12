package elearning.service;

import elearning.dto.CurriculumDto.WeekRequest;
import elearning.dto.CurriculumDto.WeekSummary;
import elearning.entity.ClassEnrollment;
import elearning.entity.Course;
import elearning.entity.CourseWeek;
import elearning.entity.Lesson;
import elearning.entity.SpeakingSubmission;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.CourseRepository;
import elearning.repository.CourseWeekRepository;
import elearning.repository.LessonRepository;
import elearning.repository.SpeakingSubmissionRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CurriculumService {
    private final CourseWeekRepository weeks;
    private final CourseRepository courses;
    private final UserRepository users;
    private final LessonRepository lessons;
    private final SpeakingSubmissionRepository speakingSubmissions;
    private final ClassEnrollmentRepository enrollments;
    private final LessonService lessonService;
    private final LessonMaterialService lessonMaterials;

    public CurriculumService(
            CourseWeekRepository weeks,
            CourseRepository courses,
            UserRepository users,
            LessonRepository lessons,
            SpeakingSubmissionRepository speakingSubmissions,
            ClassEnrollmentRepository enrollments,
            LessonService lessonService,
            LessonMaterialService lessonMaterials) {
        this.weeks = weeks;
        this.courses = courses;
        this.users = users;
        this.lessons = lessons;
        this.speakingSubmissions = speakingSubmissions;
        this.enrollments = enrollments;
        this.lessonService = lessonService;
        this.lessonMaterials = lessonMaterials;
    }

    public List<WeekSummary> teacherCurriculum(String email, Long courseId) {
        User teacher = teacher(email);
        ownedCourse(courseId, teacher.getId());
        return curriculum(courseId, false, Map.of(), null);
    }

    public List<WeekSummary> studentCurriculum(String email, Long courseId) {
        courses.findByIdAndStatus(courseId, Course.Status.PUBLISHED)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khóa học"));

        User viewer =
                users.findByEmailIgnoreCase(email)
                        .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        Map<Long, String> speakingStatus = new LinkedHashMap<>();
        if (viewer.getRole() == UserRole.STUDENT) {
            if (!enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                    viewer.getId(), courseId, ClassEnrollment.Status.ACTIVE)) {
                throw elearning.exception.LearningAccessException.notEnrolled(
                        "Bạn cần tham gia một lớp của khóa học trước khi xem chương trình học",
                        courseId);
            }
            for (SpeakingSubmission submission :
                    speakingSubmissions
                            .findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
                                    courseId, List.of(viewer.getId()))) {
                speakingStatus.putIfAbsent(
                        submission.getActivity().getId(), submission.getStatus().name());
            }
        }
        return curriculum(courseId, true, speakingStatus, viewer.getRole() == UserRole.STUDENT ? viewer : null);
    }

    public WeekSummary create(String email, Long courseId, WeekRequest request) {
        User teacher = teacher(email);
        Course course = ownedCourse(courseId, teacher.getId());
        int next =
                weeks.findAllByCourseIdOrderByWeekNumberAsc(courseId).stream()
                                .mapToInt(CourseWeek::getWeekNumber)
                                .max()
                                .orElse(0)
                        + 1;
        CourseWeek week = new CourseWeek();
        week.setCourse(course);
        week.setWeekNumber(next);
        apply(week, request);
        weeks.save(week);
        return one(week, false, Map.of(), null);
    }

    public WeekSummary update(String email, Long id, WeekRequest request) {
        User teacher = teacher(email);
        CourseWeek week =
                weeks.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuần học"));
        ownedCourse(week.getCourse().getId(), teacher.getId());
        apply(week, request);
        return one(week, false, Map.of(), null);
    }

    public void delete(String email, Long id) {
        User teacher = teacher(email);
        CourseWeek week =
                weeks.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuần học"));
        ownedCourse(week.getCourse().getId(), teacher.getId());
        if (!lessons.findAllByCourseWeekIdOrderBySortOrderAsc(id).isEmpty()) {
            throw new IllegalArgumentException(
                    "Tuần học còn bài học. Hãy chuyển hoặc xóa các bài học trước khi xóa tuần.");
        }
        weeks.delete(week);
    }

    private List<WeekSummary> curriculum(
            Long courseId,
            boolean published,
            Map<Long, String> speakingStatus,
            User student) {
        return weeks.findAllByCourseIdOrderByWeekNumberAsc(courseId).stream()
                .filter(week -> !published || week.getStatus() == CourseWeek.Status.PUBLISHED)
                .map(week -> one(week, published, speakingStatus, student))
                .toList();
    }

    private WeekSummary one(
            CourseWeek week,
            boolean published,
            Map<Long, String> speakingStatus,
            User student) {
        // Tuần chỉ nhóm các bài học; học liệu luôn được lấy theo từng bài học.
        List<WeekSummary.LessonSummary> nestedLessons =
                lessons.findAllByCourseWeekIdOrderBySortOrderAsc(week.getId()).stream()
                        .filter(item -> !published || item.getStatus() == Lesson.Status.PUBLISHED)
                        .map(
                                lesson -> {
                                    LessonService.LessonAccessState access =
                                            published && student != null
                                                    ? lessonService.accessState(student, lesson)
                                                    : new LessonService.LessonAccessState(
                                                            false, null, null, null);
                                    return new WeekSummary.LessonSummary(
                                            lesson.getId(),
                                            lesson.getTitle(),
                                            lesson.getDescription(),
                                            lesson.getSortOrder(),
                                            lesson.getEstimatedMinutes(),
                                            lesson.getStatus().name(),
                                            access.locked(),
                                            access.reason(),
                                            access.progressStatus(),
                                            access.progressPercent(),
                                            lessonMaterials.materials(
                                                    lesson, published, speakingStatus));
                                })
                        .toList();

        return new WeekSummary(
                week.getId(),
                week.getWeekNumber(),
                week.getTitle(),
                week.getDescription(),
                week.getStatus().name(),
                nestedLessons);
    }

    private void apply(CourseWeek week, WeekRequest request) {
        week.setTitle(request.title().trim());
        week.setDescription(
                request.description() == null || request.description().isBlank()
                        ? null
                        : request.description().trim());
        week.setStatus(request.status() == null ? CourseWeek.Status.DRAFT : request.status());
    }

    private User teacher(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        user ->
                                user.getRole() == UserRole.TEACHER
                                        && user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giáo viên"));
    }

    private Course ownedCourse(Long id, Long teacherId) {
        return courses.findByIdAndCreatedByTeacherId(id, teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khóa học"));
    }
}
