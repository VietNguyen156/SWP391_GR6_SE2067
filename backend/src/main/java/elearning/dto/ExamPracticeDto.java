package elearning.dto;

import java.math.BigDecimal;
import java.util.List;

public final class ExamPracticeDto {
    private ExamPracticeDto() {}

    public record PracticePlan(
            List<ReadingSkillPlan> readingSkills, List<SpeakingSkillPlan> speakingSkills) {}

    public record ReadingSkillPlan(
            String skillType,
            String label,
            int correct,
            int total,
            BigDecimal score,
            boolean hasAssessmentData,
            boolean needsPractice,
            List<ReadingPracticeActivity> activities) {}

    public record ReadingPracticeActivity(
            Long activityId, String title, String courseTitle, int questionCount) {}

    public record SpeakingSkillPlan(
            String criterion,
            String label,
            BigDecimal averageScore,
            int gradedSubmissionCount,
            boolean needsPractice,
            List<SpeakingPracticeActivity> activities) {}

    public record SpeakingPracticeActivity(
            Long activityId, String title, String courseTitle, String instruction, String promptText) {}
}
