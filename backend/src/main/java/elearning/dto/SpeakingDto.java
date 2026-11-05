package elearning.dto;


import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class SpeakingDto {
    private SpeakingDto() {}

    public record SpeakingRequest(
            @NotNull Long courseWeekId,
            @NotNull Long lessonId,
            @NotBlank @Size(max = 200) String title,
            @NotBlank String instruction,
            String promptText) {}

    public record SpeakingResponse(
            Long id,
            Long courseWeekId,
            Long lessonId,
            String title,
            String instruction,
            String promptText,
            String status,
            /** Đã có học viên nộp bài → không sửa/xóa được (chỉ có ý nghĩa với giáo viên). */
            boolean inUse,
            /** Số bài nộp và số bài đang chờ chấm (giáo viên). */
            long submissionCount,
            long pendingCount) {}

    public record SpeakingSubmissionResponse(
            Long id,
            Long studentId,
            String studentName,
            String recordingUrl,
            String status,
            BigDecimal score,
            String feedback,
            LocalDateTime submittedAt,
            LocalDateTime gradedAt,
            Integer revisionNumber,
            SpeakingRubric rubric,
            List<SpeakingRevisionResponse> revisions) {}

    public record SpeakingRubric(
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal taskCompletionScore,
            @Size(max = 65535) String taskCompletionFeedback,
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal fluencyScore,
            @Size(max = 65535) String fluencyFeedback,
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal pronunciationScore,
            @Size(max = 65535) String pronunciationFeedback,
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal vocabularyGrammarScore,
            @Size(max = 65535) String vocabularyGrammarFeedback) {}

    public record SpeakingRevisionResponse(
            Long id, Integer revisionNumber, LocalDateTime submittedAt) {}
}
