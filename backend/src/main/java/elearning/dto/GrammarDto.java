package elearning.dto;

import elearning.entity.GrammarTopic;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class GrammarDto {
    private GrammarDto() {}

    public record GrammarContentRequest(
            @NotBlank String ruleContent,
            String examples,
            String notes,
            @Positive Integer sortOrder) {}

    public record GrammarContentResponse(
            Long id,
            String ruleContent,
            String examples,
            String notes,
            Integer sortOrder,
            LocalDateTime createdAt) {}

    public record GrammarProgressResponse(
            Long topicId,
            String status,
            BigDecimal progressPercent,
            LocalDateTime lastAccessedAt) {}

    public record GrammarTopicRequest(
            @NotNull Long courseWeekId,
            @NotNull Long lessonId,
            @NotBlank @Size(max = 200) String title,
            @Size(max = 65535) String description,
            GrammarTopic.Level level) {}

    public record GrammarTopicResponse(
            Long id,
            Long teacherId,
            @NotNull Long courseWeekId,
            @NotNull Long lessonId,
            String title,
            String description,
            String level,
            String status,
            List<GrammarContentResponse> contents,
            String progressStatus,
            BigDecimal progressPercent,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            /** Đã có học viên học → không xóa được (chỉ có ý nghĩa với giáo viên). */
            boolean inUse) {}

    public record GrammarTopicSummaryResponse(
            Long id,
            @NotNull Long courseWeekId,
            @NotNull Long lessonId,
            String title,
            String description,
            String level,
            String status,
            int contentCount,
            String progressStatus,
            BigDecimal progressPercent,
            boolean inUse) {}
}
