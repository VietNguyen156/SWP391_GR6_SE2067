package elearning.dto;

import elearning.dto.GrammarExerciseDto.TopicStats;

import java.math.BigDecimal;
import java.util.List;

public final class InsightDto {
    private InsightDto() {}

    public record SkillStat(String skillType, String label, int correct, int total, BigDecimal score) {}

    /** Thống kê Listening và Grammar cho dashboard giáo viên. */
    public record ListeningGrammarInsights(
            List<SkillStat> listeningSkills,
            int listeningAttemptCount,
            List<TopicStats> weakGrammarTopics) {}
}
