package elearning.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ProgressDto {
    private ProgressDto() {}

    public record DailyStatisticResponse(
            LocalDate date,
            Integer learningMinutes,
            Integer lessonsCompleted,
            Integer quizCompleted) {}

    public record LearningHistoryResponse(
            Long id,
            String activityType,
            Long activityId,
            String activityName,
            LocalDateTime createdAt) {}

    public record LearningStatisticsResponse(
            List<DailyStatisticResponse> weekly,
            List<DailyStatisticResponse> monthly,
            Integer monthlyLearningMinutes,
            Integer monthlyLessonsCompleted,
            Integer monthlyQuizCompleted) {}

    public record LessonProgressSummary(
            Long courseId,
            String courseTitle,
            Integer completedLessons,
            Integer remainingLessons,
            Integer totalLessons,
            BigDecimal percentage,
            LocalDateTime lastLearningTime) {}

    public record OverallProgressResponse(
            BigDecimal courseProgress,
            Integer lessonCompleted,
            Integer totalLesson,
            Integer grammarCompleted,
            Integer flashcardsReviewed,
            BigDecimal quizAverageScore,
            Integer learningStreak,
            List<LessonProgressSummary> courses) {}

    public record TeacherCourseStatisticResponse(
            Long courseId,
            String courseTitle,
            Integer classCount,
            Integer studentCount,
            BigDecimal averageProgress,
            BigDecimal classCompletionRate,
            BigDecimal averageQuizScore,
            Integer completedLessons) {}

    public record TeacherDashboardResponse(
            Integer totalCourses,
            Integer totalClasses,
            Integer totalStudents,
            BigDecimal averageProgress,
            BigDecimal classCompletionRate,
            BigDecimal averageQuizScore,
            List<TeacherCourseStatisticResponse> courses) {}
}
