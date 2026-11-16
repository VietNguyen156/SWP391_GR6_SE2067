package elearning.dto;

import java.math.BigDecimal;
import java.util.List;

public final class ExamPracticeDto {
    private ExamPracticeDto() {}

    public record PracticePlan(
            List<ReadingSkillPlan> readingSkills,
            List<SpeakingSkillPlan> speakingSkills,
            List<ListeningSkillPlan> listeningSkills,
            List<GrammarTopicPlan> grammarTopics) {}

    /** Kỹ năng nghe: điểm lấy từ câu trả lời gần nhất của từng câu (kể cả các lượt luyện). */
    public record ListeningSkillPlan(
            String skillType,
            String label,
            int correct,
            int total,
            BigDecimal score,
            boolean hasAssessmentData,
            boolean needsPractice,
            List<ListeningPracticeActivity> activities) {}

    public record ListeningPracticeActivity(
            Long activityId, String title, String courseTitle, int questionCount) {}

    /** reason: NOT_STARTED, WEAK, REVIEW_DUE; null khi đã nắm vững và chưa cần ôn lại. */
    public record GrammarTopicPlan(
            Long topicId,
            String title,
            String courseTitle,
            String level,
            String mastery,
            BigDecimal bestScore,
            BigDecimal lastScore,
            int attemptCount,
            int passScore,
            int exerciseCount,
            String reason,
            boolean needsPractice) {}

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
