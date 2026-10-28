package elearning.service;

import elearning.dto.CourseDto.CompletionRequirement;
import elearning.dto.CourseDto.LessonCompletionResponse;
import elearning.dto.CourseDto.LessonRequest;
import elearning.dto.CourseDto.LessonResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.Course;
import elearning.entity.CourseWeek;
import elearning.entity.Lesson;
import elearning.entity.LessonProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.LearningAccessException;
import elearning.exception.ResourceNotFoundException;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.CourseWeekRepository;
import elearning.repository.LessonProgressRepository;
import elearning.repository.LessonRepository;
import elearning.repository.SpeakingSubmissionRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class LessonService {
    private final LessonRepository lessons;
    private final CourseWeekRepository weeks;
    private final LessonProgressRepository progressRepository;
    private final UserRepository users;
    private final ProgressService progressService;
    private final ClassEnrollmentRepository enrollments;
    private final LessonMaterialService lessonMaterials;
    private final LessonCompletionService completion;
    private final SpeakingSubmissionRepository speakingSubmissions;

    public LessonService(
            LessonRepository lessons,
            CourseWeekRepository weeks,
            LessonProgressRepository progressRepository,
            UserRepository users,
            ProgressService progressService,
            ClassEnrollmentRepository enrollments,
            LessonMaterialService lessonMaterials,
            LessonCompletionService completion,
            SpeakingSubmissionRepository speakingSubmissions) {
        this.completion = completion;
        this.speakingSubmissions = speakingSubmissions;
        this.lessons = lessons;
        this.weeks = weeks;
        this.progressRepository = progressRepository;
        this.users = users;
        this.progressService = progressService;
        this.enrollments = enrollments;
        this.lessonMaterials = lessonMaterials;
    }

    public LessonResponse create(String email, LessonRequest request) {
        User teacher = requireTeacher(email);
        if (request.courseWeekId() == null) {
            throw new IllegalArgumentException("Bài học phải thuộc một tuần");
        }
        CourseWeek week = ownedWeek(request.courseWeekId(), teacher.getId());
        Lesson lesson = new Lesson();
        lesson.setCreatedByTeacher(teacher);
        apply(lesson, week, request);
        lessons.save(lesson);
        return response(lesson, null);
    }

    public LessonResponse update(String email, Long id, LessonRequest request) {
        User teacher = requireTeacher(email);
        Lesson lesson = ownedLesson(id, teacher.getId());
        if (request.courseWeekId() == null) {
            throw new IllegalArgumentException("Bài học phải thuộc một tuần");
        }
        CourseWeek week = ownedWeek(request.courseWeekId(), teacher.getId());
        Long previousWeekId = lesson.getCourseWeek().getId();
        apply(lesson, week, request);
        lessons.saveAndFlush(lesson);
        if (!previousWeekId.equals(week.getId())) normalizeWeekOrder(previousWeekId);
        return response(lesson, null);
    }

    public void delete(String email, Long id) {
        User teacher = requireTeacher(email);
        Lesson lesson = ownedLesson(id, teacher.getId());
        if (lessonMaterials.hasMaterials(id)) {
            throw new IllegalArgumentException(
                    "Bài học còn học liệu (ngữ pháp, flashcard, listening, reading, speaking). Hãy chuyển hoặc xóa các học liệu trong bài trước khi xóa bài học.");
        }
        Long weekId = lesson.getCourseWeek().getId();
        lessons.delete(lesson);
        lessons.flush();
        normalizeWeekOrder(weekId);
    }

    /** Sắp xếp lại các bài trong tuần theo đúng thứ tự `ids` (phải đủ và đúng các bài của tuần). */
    public void reorder(String email, Long weekId, List<Long> ids) {
        User teacher = requireTeacher(email);
        ownedWeek(weekId, teacher.getId());
        List<Lesson> current = lessons.findAllByCourseWeekIdOrderBySortOrderAsc(weekId);
        Map<Long, Lesson> byId = new HashMap<>();
        current.forEach(lesson -> byId.put(lesson.getId(), lesson));
        if (ids.size() != current.size() || !byId.keySet().equals(new HashSet<>(ids))) {
            throw new IllegalArgumentException(
                    "Danh sách bài học không khớp với tuần hiện tại. Hãy tải lại trang rồi thử lại.");
        }
        normalize(ids.stream().map(byId::get).toList());
    }

    @Transactional(readOnly = true)
    public LessonResponse teacherLesson(String email, Long id) {
        User teacher = requireTeacher(email);
        return response(ownedLesson(id, teacher.getId()), null);
    }

    @Transactional(readOnly = true)
    public LessonResponse studentLesson(String email, Long id) {
        User student = requireStudent(email);
        Lesson lesson = publishedLesson(id);
        requireEnrollment(student, lesson);
        requireUnlocked(student, lesson);
        LessonProgress progress =
                progressRepository.findByStudentIdAndLessonId(student.getId(), id).orElse(null);
        return response(lesson, progress, student);
    }

    /** Học viên mở bài lần đầu: ghi nhận "Đang học". Không đổi bài đã hoàn thành. */
    public LessonCompletionResponse start(String email, Long id) {
        User student = requireStudent(email);
        Lesson lesson = publishedLesson(id);
        requireEnrollment(student, lesson);
        requireUnlocked(student, lesson);
        LocalDateTime now = LocalDateTime.now();
        LessonProgress progress =
                progressRepository
                        .findByStudentIdAndLessonId(student.getId(), id)
                        .orElseGet(() -> newProgress(student, lesson, now));
        if (progress.getStatus() != LessonProgress.Status.COMPLETED) {
            progress.setStatus(LessonProgress.Status.IN_PROGRESS);
            progress.setProgressPercent(
                    LessonCompletionService.percentDone(completion.requirements(lesson, student)));
        }
        if (progress.getStartedAt() == null) progress.setStartedAt(now);
        progress.setLastAccessedAt(now);
        progressRepository.save(progress);
        return new LessonCompletionResponse(
                id, progress.getStatus().name(), progress.getProgressPercent(), progress.getCompletedAt());
    }

    /**
     * Reuses the same enrollment/unlock rules for learning materials that belong to a lesson.
     * This prevents a student from bypassing a locked lesson by opening a material URL directly.
     *
     * <p>Chỉ đọc, không bao giờ cần rollback: các danh sách (ngữ pháp, flashcards) gọi hàm này
     * rồi bắt lỗi "bài bị khóa" để lọc; nếu lỗi đánh dấu rollback-only thì cả request sẽ thành 500.
     */
    @Transactional(readOnly = true, noRollbackFor = RuntimeException.class)
    public void requireStudentAccess(User student, Lesson lesson) {
        if (student == null
                || student.getRole() != UserRole.STUDENT
                || student.getStatus() != UserStatus.ACTIVE) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản học viên");
        }
        Lesson published = publishedLesson(lesson.getId());
        requireEnrollment(student, published);
        requireUnlocked(student, published);
    }

    @Transactional(readOnly = true)
    public LessonAccessState accessState(User student, Lesson lesson) {
        LessonProgress progress =
                progressRepository
                        .findByStudentIdAndLessonId(student.getId(), lesson.getId())
                        .orElse(null);
        try {
            requireStudentAccess(student, lesson);
            var requirements = completion.requirements(lesson, student);
            return new LessonAccessState(
                    false,
                    null,
                    progressStatus(progress, requirements),
                    progressPercent(progress, requirements));
        } catch (RuntimeException ex) {
            return new LessonAccessState(
                    true,
                    ex.getMessage(),
                    progress == null
                            ? LessonProgress.Status.LOCKED.name()
                            : progress.getStatus().name(),
                    progress == null ? BigDecimal.ZERO : progress.getProgressPercent());
        }
    }

    public record LessonAccessState(
            boolean locked, String reason, String progressStatus, BigDecimal progressPercent) {}

    public LessonCompletionResponse complete(String email, Long id) {
        User student = requireStudent(email);
        Lesson lesson = publishedLesson(id);
        requireEnrollment(student, lesson);
        requireUnlocked(student, lesson);
        LessonProgress progress = progressOf(student, lesson);
        // Bài đã hoàn thành trước đây được giữ nguyên, kể cả khi giáo viên thêm học liệu sau đó.
        if (progress.getStatus() != LessonProgress.Status.COMPLETED) {
            String missing =
                    LessonCompletionService.missingMessage(
                            completion.requirements(lesson, student));
            if (missing != null) throw new IllegalArgumentException(missing);
            markCompleted(student, lesson, progress);
        }
        return new LessonCompletionResponse(
                id,
                progress.getStatus().name(),
                progress.getProgressPercent(),
                progress.getCompletedAt());
    }

    /**
     * Gọi sau khi học viên nộp Listening / Reading / Speaking của bài: cập nhật tiến độ và tự đánh
     * dấu hoàn thành khi đã nộp đủ mọi học liệu bắt buộc.
     */
    public void autoComplete(User student, Lesson lesson) {
        if (lesson == null || !isStudentVisibleLesson(lesson)) return;
        LessonProgress progress = progressOf(student, lesson);
        if (progress.getStatus() == LessonProgress.Status.COMPLETED) return;
        List<CompletionRequirement> requirements = completion.requirements(lesson, student);
        if (!requirements.isEmpty() && LessonCompletionService.isComplete(requirements)) {
            markCompleted(student, lesson, progress);
            return;
        }
        progress.setStatus(LessonProgress.Status.IN_PROGRESS);
        progress.setProgressPercent(LessonCompletionService.percentDone(requirements));
        progress.setLastAccessedAt(LocalDateTime.now());
        progressRepository.save(progress);
    }

    private LessonProgress progressOf(User student, Lesson lesson) {
        return progressRepository
                .findByStudentIdAndLessonId(student.getId(), lesson.getId())
                .orElseGet(() -> newProgress(student, lesson, LocalDateTime.now()));
    }

    private void markCompleted(User student, Lesson lesson, LessonProgress progress) {
        LocalDateTime now = LocalDateTime.now();
        if (progress.getStartedAt() == null) progress.setStartedAt(now);
        progress.setStatus(LessonProgress.Status.COMPLETED);
        progress.setProgressPercent(new BigDecimal("100.00"));
        progress.setCompletedAt(now);
        progress.setLastAccessedAt(now);
        progressRepository.save(progress);
        progressService.recordLessonCompleted(student, lesson, true);
    }

    /** Bài mới (hoặc chuyển sang tuần khác) luôn được xếp cuối tuần. */
    private void apply(Lesson lesson, CourseWeek week, LessonRequest request) {
        if (lesson.getCourseWeek() == null || !lesson.getCourseWeek().getId().equals(week.getId())) {
            lesson.setSortOrder(
                    lessons.findTopByCourseWeekIdOrderBySortOrderDesc(week.getId())
                            .map(existing -> existing.getSortOrder() + 1)
                            .orElse(1));
        }
        lesson.setCourseWeek(week);
        lesson.setTitle(request.title().trim());
        lesson.setDescription(clean(request.description()));
        lesson.setEstimatedMinutes(request.estimatedMinutes());
        // Ẩn/hiện chỉ còn ở khóa học và tuần; bài và học liệu luôn hiển thị.
        lesson.setStatus(Lesson.Status.PUBLISHED);
    }

    private LessonProgress newProgress(User student, Lesson lesson, LocalDateTime now) {
        LessonProgress created = new LessonProgress();
        created.setStudent(student);
        created.setLesson(lesson);
        created.setStartedAt(now);
        return created;
    }

    /** Trạng thái hiển thị: đã làm một phần điều kiện mà chưa có bản ghi vẫn tính là "Đang học". */
    private static String progressStatus(
            LessonProgress progress, List<CompletionRequirement> requirements) {
        if (progress != null && progress.getStatus() != LessonProgress.Status.AVAILABLE) {
            return progress.getStatus().name();
        }
        boolean started = requirements.stream().anyMatch(CompletionRequirement::done);
        return (started ? LessonProgress.Status.IN_PROGRESS : LessonProgress.Status.AVAILABLE)
                .name();
    }

    /** % tiến độ = 100 khi đã hoàn thành, còn lại theo tỉ lệ điều kiện đã đạt. */
    private static BigDecimal progressPercent(
            LessonProgress progress, List<CompletionRequirement> requirements) {
        if (progress != null && progress.getStatus() == LessonProgress.Status.COMPLETED) {
            return progress.getProgressPercent();
        }
        return LessonCompletionService.percentDone(requirements);
    }

    private LessonResponse response(Lesson lesson, LessonProgress progress) {
        return response(lesson, progress, null);
    }

    private LessonResponse response(Lesson lesson, LessonProgress progress, User student) {
        boolean studentView = student != null;
        List<CompletionRequirement> requirements =
                studentView ? completion.requirements(lesson, student) : List.of();
        CourseWeek week = lesson.getCourseWeek();
        Course course = week.getCourse();
        return new LessonResponse(
                lesson.getId(),
                course.getId(),
                course.getTitle(),
                week.getId(),
                week.getWeekNumber(),
                week.getTitle(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getSortOrder(),
                lesson.getEstimatedMinutes(),
                lesson.getStatus().name(),
                progressStatus(progress, requirements),
                studentView
                        ? progressPercent(progress, requirements)
                        : progress == null ? BigDecimal.ZERO : progress.getProgressPercent(),
                lesson.getCreatedAt(),
                lesson.getUpdatedAt(),
                lesson.getId() == null
                        ? List.of()
                        : lessonMaterials.materials(
                                lesson, studentView, speakingStatus(lesson, student)),
                requirements);
    }

    /** Trạng thái bài Speaking của học viên trong bài (để trang bài học hiện "Đã nộp / Đã chấm"). */
    private Map<Long, String> speakingStatus(Lesson lesson, User student) {
        if (student == null || lesson.getId() == null) return null;
        Map<Long, String> result = new HashMap<>();
        speakingSubmissions
                .findAllByActivityLessonIdAndStudentId(lesson.getId(), student.getId())
                .forEach(item -> result.put(item.getActivity().getId(), item.getStatus().name()));
        return result;
    }

    private void normalizeWeekOrder(Long weekId) {
        List<Lesson> items = lessons.findAllByCourseWeekIdOrderBySortOrderAsc(weekId);
        normalize(items);
    }

    private void normalize(List<Lesson> items) {
        if (items.isEmpty()) return;
        int temporary =
                items.stream().mapToInt(Lesson::getSortOrder).max().orElse(0) + items.size() + 100;
        for (Lesson item : items) item.setSortOrder(temporary++);
        lessons.saveAllAndFlush(items);
        for (int i = 0; i < items.size(); i++) items.get(i).setSortOrder(i + 1);
        lessons.saveAll(items);
    }

    /**
     * Mở khóa tuần tự: bài đầu tiên của khóa luôn mở; các bài sau chỉ mở khi bài hiển thị liền
     * trước (theo thứ tự tuần → bài) đã hoàn thành.
     */
    private void requireUnlocked(User student, Lesson lesson) {
        Course course = courseOf(lesson);
        List<Lesson> ordered =
                lessons
                        .findAllByCourseWeekCourseIdOrderByCourseWeekWeekNumberAscSortOrderAsc(
                                course.getId())
                        .stream()
                        .filter(this::isStudentVisibleLesson)
                        .toList();
        int index = -1;
        for (int i = 0; i < ordered.size(); i++) {
            if (ordered.get(i).getId().equals(lesson.getId())) {
                index = i;
                break;
            }
        }
        if (index <= 0) return;
        Lesson previous = ordered.get(index - 1);
        boolean completed =
                progressRepository
                        .findByStudentIdAndLessonId(student.getId(), previous.getId())
                        .map(p -> p.getStatus() == LessonProgress.Status.COMPLETED)
                        .orElse(false);
        if (!completed) {
            throw LearningAccessException.locked(
                    "Hoàn thành bài “" + previous.getTitle() + "” trước để mở bài này",
                    course.getId(),
                    lesson.getId());
        }
    }

    private boolean isStudentVisibleLesson(Lesson lesson) {
        return lesson.getStatus() == Lesson.Status.PUBLISHED
                && lesson.getCourseWeek().getStatus() == CourseWeek.Status.PUBLISHED
                && lesson.getCourseWeek().getCourse().getStatus() == Course.Status.PUBLISHED;
    }

    private void requireEnrollment(User student, Lesson lesson) {
        Long courseId = courseOf(lesson).getId();
        if (!enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                student.getId(), courseId, ClassEnrollment.Status.ACTIVE)) {
            throw LearningAccessException.notEnrolled(
                    "Bạn cần tham gia một lớp của khóa học trước khi học bài này", courseId);
        }
    }

    private Lesson publishedLesson(Long id) {
        Lesson lesson =
                lessons.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học"));
        if (!isStudentVisibleLesson(lesson)) {
            throw new ResourceNotFoundException("Không tìm thấy bài học");
        }
        return lesson;
    }

    private Course courseOf(Lesson lesson) {
        return lesson.getCourseWeek().getCourse();
    }

    private Lesson ownedLesson(Long id, Long teacherId) {
        return lessons.findByIdAndCreatedByTeacherId(id, teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học"));
    }

    private CourseWeek ownedWeek(Long id, Long teacherId) {
        return weeks.findById(id)
                .filter(
                        week ->
                                week.getCourse()
                                        .getCreatedByTeacher()
                                        .getId()
                                        .equals(teacherId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tuần học"));
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

    private User requireStudent(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        user ->
                                user.getRole() == UserRole.STUDENT
                                        && user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy tài khoản học viên"));
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
