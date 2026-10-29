package elearning.service;

import elearning.dto.ProgressDto.DailyStatisticResponse;
import elearning.dto.ProgressDto.LearningHistoryResponse;
import elearning.dto.ProgressDto.LearningStatisticsResponse;
import elearning.dto.ProgressDto.LessonProgressSummary;
import elearning.dto.ProgressDto.OverallProgressResponse;
import elearning.entity.Course;
import elearning.entity.DailyLearningStatistic;
import elearning.entity.Flashcard;
import elearning.entity.FlashcardProgress;
import elearning.entity.GrammarTopic;
import elearning.entity.LearningHistory;
import elearning.entity.CourseWeek;
import elearning.entity.Lesson;
import elearning.entity.LessonProgress;
import elearning.entity.StudentGrammarProgress;
import elearning.entity.StudentLearningProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.CourseRepository;
import elearning.repository.DailyLearningStatisticRepository;
import elearning.repository.FlashcardProgressRepository;
import elearning.repository.LearningHistoryRepository;
import elearning.repository.LessonProgressRepository;
import elearning.repository.LessonRepository;
import elearning.repository.StudentGrammarProgressRepository;
import elearning.repository.StudentLearningProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProgressService {
    private final StudentLearningProgressRepository courseProgress;
    private final LearningHistoryRepository history;
    private final DailyLearningStatisticRepository daily;
    private final LessonProgressRepository lessonProgress;
    private final LessonRepository lessons;
    private final CourseRepository courses;
    private final StudentGrammarProgressRepository grammarProgress;
    private final FlashcardProgressRepository flashcardProgress;
    private final JdbcTemplate db;
    private final UserRepository users;

    public ProgressService(
            StudentLearningProgressRepository cp,
            LearningHistoryRepository h,
            DailyLearningStatisticRepository d,
            LessonProgressRepository lp,
            LessonRepository l,
            CourseRepository c,
            StudentGrammarProgressRepository gp,
            FlashcardProgressRepository fp,
            JdbcTemplate db,
            UserRepository u) {
        courseProgress = cp;
        history = h;
        daily = d;
        lessonProgress = lp;
        lessons = l;
        courses = c;
        grammarProgress = gp;
        flashcardProgress = fp;
        this.db = db;
        users = u;
    }

    public void recordLessonCompleted(User student, Lesson lesson, boolean firstCompletion) {
        LocalDateTime now = LocalDateTime.now();
        syncCourse(student, lesson.getCourseWeek().getCourse(), now);
        if (firstCompletion) {
            recordHistory(
                    student,
                    LearningHistory.ActivityType.LESSON,
                    lesson.getId(),
                    lesson.getTitle(),
                    now);
            incrementDaily(
                    student,
                    Math.max(1, Optional.ofNullable(lesson.getEstimatedMinutes()).orElse(1)),
                    1,
                    0);
        }
    }

    public void recordGrammarCompleted(User student, GrammarTopic topic, boolean firstCompletion) {
        if (!firstCompletion) return;
        LocalDateTime now = LocalDateTime.now();
        recordHistory(
                student,
                LearningHistory.ActivityType.GRAMMAR,
                topic.getId(),
                topic.getTitle(),
                now);
        incrementDaily(student, 5, 0, 0);
    }

    public void recordFlashcardReviewed(User student, Flashcard card, boolean firstActivity) {
        if (!firstActivity) return;
        LocalDateTime now = LocalDateTime.now();
        recordHistory(
                student,
                LearningHistory.ActivityType.FLASHCARD,
                card.getId(),
                card.getFrontText(),
                now);
        incrementDaily(student, 1, 0, 0);
    }


    public OverallProgressResponse overall(String email) {
        User student = student(email);
        List<StudentLearningProgress> rows =
                courseProgress.findAllByStudentIdOrderByLastLearningTimeDesc(student.getId());
        rows = new ArrayList<>(rows);
        for (int i = 0; i < rows.size(); i++)
            rows.set(
                    i,
                    syncCourse(
                            student, rows.get(i).getCourse(), rows.get(i).getLastLearningTime()));
        int completed = rows.stream().mapToInt(StudentLearningProgress::getCompletedLessons).sum();
        int total = rows.stream().mapToInt(StudentLearningProgress::getTotalLessons).sum();
        BigDecimal overall = percent(completed, total);
        int grammar =
                (int)
                        grammarProgress.findAllByStudentId(student.getId()).stream()
                                .filter(
                                        x ->
                                                x.getStatus()
                                                        == StudentGrammarProgress.Status.COMPLETED)
                                .count();
        int flashcards =
                (int)
                        flashcardProgress.findAllByStudentId(student.getId()).stream()
                                .filter(
                                        x ->
                                                x.getMemoryStatus()
                                                        != FlashcardProgress.MemoryStatus.NEW)
                                .count();
        BigDecimal averageScore = db.queryForObject("SELECT COALESCE(AVG(100.0*earned_points/NULLIF(total_points,0)),0) FROM test_attempts WHERE student_id=? AND status='GRADED'", BigDecimal.class, student.getId());
        return new OverallProgressResponse(
                overall,
                completed,
                total,
                grammar,
                flashcards,
                averageScore,
                streak(student.getId()),
                rows.stream().map(this::summary).toList());
    }

    @Transactional(readOnly = true)
    public LessonProgressSummary courseProgress(String email, Long courseId) {
        User student = student(email);
        Course course =
                courses.findByIdAndStatus(courseId, Course.Status.PUBLISHED)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy khóa học"));
        StudentLearningProgress row =
                courseProgress.findByStudentIdAndCourseId(student.getId(), courseId).orElse(null);
        if (row == null) {
            int total = visibleLessonCount(courseId);
            return new LessonProgressSummary(
                    courseId, course.getTitle(), 0, total, total, BigDecimal.ZERO, null);
        }
        return summary(row);
    }

    @Transactional(readOnly = true)
    public List<LearningHistoryResponse> history(String email) {
        User student = student(email);
        return history.findTop50ByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(
                        x ->
                                new LearningHistoryResponse(
                                        x.getId(),
                                        x.getActivityType().name(),
                                        x.getActivityId(),
                                        x.getActivityName(),
                                        x.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public LearningStatisticsResponse statistics(String email) {
        User student = student(email);
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate from = today.minusDays(29);
        List<DailyLearningStatistic> raw =
                daily.findAllByStudentIdAndLearningDateBetweenOrderByLearningDateAsc(
                        student.getId(), from, today);
        Map<LocalDate, DailyLearningStatistic> map =
                raw.stream()
                        .collect(
                                Collectors.toMap(
                                        DailyLearningStatistic::getLearningDate,
                                        Function.identity()));
        List<DailyStatisticResponse> monthly = dates(from, today, map);
        List<DailyStatisticResponse> weekly =
                monthly.subList(Math.max(0, monthly.size() - 7), monthly.size());
        List<DailyLearningStatistic> currentMonth =
                daily.findAllByStudentIdAndLearningDateBetweenOrderByLearningDateAsc(
                        student.getId(), monthStart, today);
        return new LearningStatisticsResponse(
                List.copyOf(weekly),
                monthly,
                currentMonth.stream().mapToInt(DailyLearningStatistic::getLearningMinutes).sum(),
                currentMonth.stream().mapToInt(DailyLearningStatistic::getLessonsCompleted).sum(),
                currentMonth.stream().mapToInt(DailyLearningStatistic::getTestCompleted).sum());
    }

    private StudentLearningProgress syncCourse(
            User student, Course course, LocalDateTime lastTime) {
        int total = visibleLessonCount(course.getId());
        int completed =
                (int)
                        lessonProgress.countByStudentIdAndLessonCourseWeekCourseIdAndStatus(
                                student.getId(), course.getId(), LessonProgress.Status.COMPLETED);
        StudentLearningProgress row =
                courseProgress
                        .findByStudentIdAndCourseId(student.getId(), course.getId())
                        .orElseGet(StudentLearningProgress::new);
        row.setStudent(student);
        row.setCourse(course);
        row.setCompletedLessons(completed);
        row.setTotalLessons(total);
        row.setProgressPercentage(percent(completed, total));
        if (lastTime != null) row.setLastLearningTime(lastTime);
        return courseProgress.save(row);
    }

    /** Mẫu số tiến độ: số bài học viên đang thấy (bài hiển thị trong tuần hiển thị), khớp với lộ trình. */
    private int visibleLessonCount(Long courseId) {
        return (int)
                lessons.countByCourseWeekCourseIdAndCourseWeekStatusAndStatus(
                        courseId, CourseWeek.Status.PUBLISHED, Lesson.Status.PUBLISHED);
    }

    private LessonProgressSummary summary(StudentLearningProgress row) {
        int remaining = Math.max(0, row.getTotalLessons() - row.getCompletedLessons());
        return new LessonProgressSummary(
                row.getCourse().getId(),
                row.getCourse().getTitle(),
                row.getCompletedLessons(),
                remaining,
                row.getTotalLessons(),
                row.getProgressPercentage(),
                row.getLastLearningTime());
    }

    private void recordHistory(
            User student,
            LearningHistory.ActivityType type,
            Long activityId,
            String name,
            LocalDateTime time) {
        if (history.existsByStudentIdAndActivityTypeAndActivityId(
                student.getId(), type, activityId)) return;
        LearningHistory item = new LearningHistory();
        item.setStudent(student);
        item.setActivityType(type);
        item.setActivityId(activityId);
        String safeName = name == null ? type.name() : name.trim();
        item.setActivityName(safeName.length() > 255 ? safeName.substring(0, 255) : safeName);
        item.setCreatedAt(time);
        history.save(item);
    }

    private void incrementDaily(
            User student, int minutes, int completedLessons, int completedTests) {
        LocalDate date = LocalDate.now();
        DailyLearningStatistic item =
                daily.findByStudentIdAndLearningDate(student.getId(), date)
                        .orElseGet(DailyLearningStatistic::new);
        item.setStudent(student);
        item.setLearningDate(date);
        item.setLearningMinutes(item.getLearningMinutes() + minutes);
        item.setLessonsCompleted(item.getLessonsCompleted() + completedLessons);
        item.setTestCompleted(item.getTestCompleted() + completedTests);
        daily.save(item);
    }

    private int streak(Long studentId) {
        List<DailyLearningStatistic> items =
                daily.findAllByStudentIdOrderByLearningDateDesc(studentId);
        if (items.isEmpty()) return 0;
        Set<LocalDate> active =
                items.stream()
                        .filter(
                                x ->
                                        x.getLearningMinutes() > 0
                                                || x.getLessonsCompleted() > 0
                                                || x.getTestCompleted() > 0)
                        .map(DailyLearningStatistic::getLearningDate)
                        .collect(Collectors.toSet());
        LocalDate day =
                active.contains(LocalDate.now()) ? LocalDate.now() : LocalDate.now().minusDays(1);
        int count = 0;
        while (active.contains(day)) {
            count++;
            day = day.minusDays(1);
        }
        return count;
    }

    private List<DailyStatisticResponse> dates(
            LocalDate from, LocalDate to, Map<LocalDate, DailyLearningStatistic> map) {
        List<DailyStatisticResponse> result = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            DailyLearningStatistic x = map.get(date);
            result.add(
                    x == null
                            ? new DailyStatisticResponse(date, 0, 0, 0)
                            : new DailyStatisticResponse(
                                    date,
                                    x.getLearningMinutes(),
                                    x.getLessonsCompleted(),
                                    x.getTestCompleted()));
        }
        return result;
    }

    private BigDecimal percent(int completed, int total) {
        return total == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(completed * 100.0 / total).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal average(List<BigDecimal> values) {
        return values.isEmpty()
                ? BigDecimal.ZERO
                : values.stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(x -> x.getRole() == UserRole.STUDENT && x.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));
    }
}
