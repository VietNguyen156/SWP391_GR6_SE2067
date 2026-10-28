package elearning.dto;

import elearning.dto.GrammarDto.AttachmentResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class ReadingDto {
    private ReadingDto() {}

    public record ReadingRequest(
            @NotNull Long courseWeekId,
            @NotNull Long lessonId,
            @NotBlank @Size(max = 200) String title,
            String description,
            String instruction,
            String passage,
            String passageFormat,
            String toeicPart,
            String passageType,
            List<@NotNull @Valid Question> questions) {
        public record Question(
                @NotBlank String questionText,
                String explanation,
                String evidence,
                @NotNull @Size(min = 2) List<@NotNull @Valid Option> options) {
            @AssertTrue(message = "Mỗi câu hỏi phải có đúng một đáp án đúng")
            public boolean isExactlyOneCorrect() {
                return options != null
                        && options.stream().allMatch(Objects::nonNull)
                        && options.stream().filter(Option::correct).count() == 1;
            }
        }

        public record Option(@NotBlank String optionText, boolean correct) {}
    }

    public record ReadingResponse(
            Long id,
            Long courseWeekId,
            Long lessonId,
            String title,
            String description,
            String instruction,
            String passage,
            String passageFormat,
            String toeicPart,
            String passageType,
            String status,
            List<Question> questions,
            List<AttachmentResponse> attachments,
            /** Đã có học viên nộp bài → không sửa/xóa được (chỉ có ý nghĩa với giáo viên). */
            boolean inUse,
            long attemptCount) {
        /** explanation / evidence chỉ có ở bản của giáo viên; học viên nhận trong kết quả sau khi nộp. */
        public record Question(
                Long id,
                String questionText,
                String explanation,
                String evidence,
                List<Option> options) {}

        public record Option(Long id, String optionText, boolean correct) {}
    }

    public record ReadingResultResponse(
            Long attemptId,
            BigDecimal score,
            int correct,
            int total,
            LocalDateTime submittedAt,
            Map<Long, Long> answers,
            Map<Long, Long> correctAnswers,
            /** Câu → giải thích / căn cứ trong bài (chỉ sau khi nộp). */
            Map<Long, String> explanations,
            Map<Long, String> evidence) {}

    public record ReadingSubmitRequest(Map<Long, Long> answers) {}
}
