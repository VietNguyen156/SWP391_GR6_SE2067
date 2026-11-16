package elearning.dto;

import jakarta.validation.Valid;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.List;
import java.util.Map;

public final class ListeningDto {
    private ListeningDto() {}

    public record ListeningRequest(
            @NotNull Long courseWeekId,
            @NotNull Long lessonId,
            @NotBlank @Size(max = 200) String title,
            String description,
            String instruction,
            String audioUrl,
            @Size(max = 20000) String transcript,
            List<@NotNull @Valid Question> questions) {
        public record Question(@NotBlank String questionText,
                @NotNull @Size(min = 2) List<@NotNull @Valid Option> options) {
            @AssertTrue(message = "Mỗi câu hỏi phải có đúng một đáp án đúng")
            public boolean isExactlyOneCorrect() {
                return options != null && options.stream().allMatch(Objects::nonNull)
                        && options.stream().filter(Option::correct).count() == 1;
            }
        }

        public record Option(@NotBlank String optionText, boolean correct) {}
    }

    public record ListeningResponse(
            Long id,
            Long courseWeekId,
            Long lessonId,
            String title,
            String description,
            String instruction,
            String audioUrl,
            /** Chỉ trả cho giáo viên; học viên xem transcript qua kết quả sau khi nộp. */
            String transcript,
            String status,
            List<Question> questions,
            /** Đã có học viên nộp bài → không sửa/xóa được (chỉ có ý nghĩa với giáo viên). */
            boolean inUse,
            /** Số lượt học viên đã nộp (giáo viên). */
            long attemptCount) {
        public record Question(Long id, String questionText, List<Option> options) {}

        public record Option(Long id, String optionText, boolean correct) {}
    }

    public record ListeningResultResponse(
            Long attemptId,
            BigDecimal score,
            int correct,
            int total,
            java.time.LocalDateTime submittedAt,
            Map<Long, Long> answers,
            /** Transcript chỉ có sau khi đã nộp bài. */
            String transcript) {}

    public record ListeningSubmitRequest(Map<Long, Long> answers) {}
}
