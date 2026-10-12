package elearning.service;

import elearning.dto.CourseDto.CourseResponse;
import elearning.dto.CourseDto.CourseSummaryResponse;
import elearning.dto.CourseDto.CreateCourseRequest;
import elearning.dto.CourseDto.UpdateCourseRequest;
import elearning.entity.Course;
import elearning.entity.CourseWeek;
import elearning.entity.Lesson;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ResourceNotFoundException;
import elearning.repository.ClassRoomRepository;
import elearning.repository.CourseRepository;
import elearning.repository.CourseWeekRepository;
import elearning.repository.LessonRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class CourseService {
    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final UserRepository users;
    private final ClassRoomRepository classes;
    private final CourseWeekRepository weeks;

    public CourseService(
            CourseRepository courses,
            LessonRepository lessons,
            UserRepository users,
            ClassRoomRepository classes,
            CourseWeekRepository weeks) {
        this.courses = courses;
        this.lessons = lessons;
        this.users = users;
        this.classes = classes;
        this.weeks = weeks;
    }

    public CourseResponse create(String email, CreateCourseRequest request) {
        User teacher = requireTeacher(email);
        Course course = new Course();
        course.setCreatedByTeacher(teacher);
        course.setTitle(request.title().trim());
        course.setSlug(uniqueSlug(request.title()));
        course.setDescription(clean(request.description()));
        course.setLevel(request.level() == null ? Course.Level.ALL_LEVELS : request.level());
        course.setTargetScore(request.targetScore());
        course.setThumbnailUrl(clean(request.thumbnailUrl()));
        course.setStatus(request.status() == null ? Course.Status.DRAFT : request.status());
        if (course.getStatus() == Course.Status.PUBLISHED)
            course.setPublishedAt(LocalDateTime.now());
        courses.save(course);
        return details(course, false);
    }

    public CourseResponse update(String email, Long id, UpdateCourseRequest request) {
        User teacher = requireTeacher(email);
        Course course = ownedCourse(id, teacher.getId());
        course.setTitle(request.title().trim());
        course.setDescription(clean(request.description()));
        if (request.level() != null) course.setLevel(request.level());
        course.setTargetScore(request.targetScore());
        course.setThumbnailUrl(clean(request.thumbnailUrl()));
        Course.Status previous = course.getStatus();
        course.setStatus(request.status());
        if (request.status() == Course.Status.PUBLISHED && previous != Course.Status.PUBLISHED) {
            course.setPublishedAt(LocalDateTime.now());
        }
        courses.save(course);
        return details(course, false);
    }

    public void delete(String email, Long id) {
        User teacher = requireTeacher(email);
        Course course = ownedCourse(id, teacher.getId());
        if (classes.countByCourseId(id) > 0) {
            throw new IllegalArgumentException(
                    "Khóa học đã có lớp học nên không thể xóa. Hãy ẩn/lưu trữ khóa học để giữ dữ liệu học viên.");
        }
        courses.delete(course);
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> teacherCourses(String email) {
        User teacher = requireTeacher(email);
        return courses.findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(teacher.getId()).stream()
                .map(course -> summary(course, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseResponse teacherCourse(String email, Long id) {
        User teacher = requireTeacher(email);
        return details(ownedCourse(id, teacher.getId()), false);
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> publishedCourses() {
        return courses.findAllByStatusOrderByPublishedAtDesc(Course.Status.PUBLISHED).stream()
                .map(course -> summary(course, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseResponse publishedCourse(Long id) {
        Course course =
                courses.findByIdAndStatus(id, Course.Status.PUBLISHED)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Không tìm thấy khóa học"));
        return details(course, true);
    }

    private CourseSummaryResponse summary(Course course, boolean publishedOnly) {
        // Học viên (publishedOnly): chỉ đếm bài đang hiển thị với họ, tức bài nằm trong tuần hiển thị;
        // khớp với weekCount và với lộ trình trả về ở /student/curriculum. Giáo viên: đếm mọi bài.
        long visibleLessonCount =
                publishedOnly
                        ? lessons.countByCourseWeekCourseIdAndCourseWeekStatusAndStatus(
                                course.getId(), CourseWeek.Status.PUBLISHED, Lesson.Status.PUBLISHED)
                        : lessons.countByCourseWeekCourseId(course.getId());
        return new CourseSummaryResponse(
                course.getId(),
                course.getTitle(),
                course.getSlug(),
                course.getDescription(),
                course.getLevel().name(),
                weekCount(course, publishedOnly),
                course.getTargetScore(),
                course.getPrice(),
                course.getThumbnailUrl(),
                course.getStatus().name(),
                visibleLessonCount,
                course.getPublishedAt(),
                course.getUpdatedAt());
    }

    private CourseResponse details(Course course, boolean publishedOnly) {
        User teacher = course.getCreatedByTeacher();
        return new CourseResponse(
                course.getId(),
                teacher.getId(),
                teacher.getFullName(),
                course.getTitle(),
                course.getSlug(),
                course.getDescription(),
                course.getLevel().name(),
                weekCount(course, publishedOnly),
                course.getTargetScore(),
                course.getPrice(),
                course.getThumbnailUrl(),
                course.getStatus().name(),
                course.getPublishedAt(),
                course.getCreatedAt(),
                course.getUpdatedAt());
    }

    private User requireTeacher(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        user ->
                                user.getRole() == UserRole.TEACHER
                                        && user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy tài khoản giáo viên"));
    }

    private Course ownedCourse(Long id, Long teacherId) {
        return courses.findByIdAndCreatedByTeacherId(id, teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học"));
    }

    /** Slug sinh từ tên khóa học (bỏ dấu tiếng Việt); trùng thì thêm hậu tố -2, -3... */
    private String uniqueSlug(String title) {
        String base = normalizeSlug(title);
        if (base.isBlank()) base = "khoa-hoc";
        String candidate = base;
        int suffix = 2;
        while (courses.existsBySlugIgnoreCase(candidate)) candidate = base + "-" + suffix++;
        return candidate;
    }

    private long weekCount(Course course, boolean publishedOnly) {
        return publishedOnly
                ? weeks.countByCourseIdAndStatus(course.getId(), CourseWeek.Status.PUBLISHED)
                : weeks.countByCourseId(course.getId());
    }

    private String normalizeSlug(String value) {
        String normalized =
                Normalizer.normalize(value, Normalizer.Form.NFD)
                        .replaceAll("\\p{M}+", "")
                        .replace('đ', 'd')
                        .replace('Đ', 'D')
                        .toLowerCase(Locale.ROOT)
                        .replaceAll("[^a-z0-9]+", "-")
                        .replaceAll("(^-|-$)", "");
        return normalized.length() > 200
                ? normalized.substring(0, 200).replaceAll("-$", "")
                : normalized;
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
