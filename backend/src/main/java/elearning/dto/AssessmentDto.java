package elearning.dto;

import elearning.entity.Question;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.List;

public final class AssessmentDto {
    private AssessmentDto() {}

    public record AnswerOptionRequest(Long id, @NotBlank String content, boolean correct) {}

    public record AnswerOptionResponse(
            Long id, String content, boolean correct, Integer sortOrder) {}

    public record QuestionRequest(
            Long lessonId,
            @NotBlank String questionText,
            String explanation,
            @NotNull Question.Difficulty difficulty,
            @NotNull @Size(min = 4, max = 4) List<@NotNull @Valid AnswerOptionRequest> options) {
        @AssertTrue(message = "Phải có đúng một đáp án đúng")
        public boolean isExactlyOneCorrect() {
            return options != null
                    && options.stream().allMatch(Objects::nonNull)
                    && options.stream().filter(AnswerOptionRequest::correct).count() == 1;
        }

        @AssertTrue(message = "Danh sách đáp án không được trùng ID")
        public boolean isOptionListUnique() {
            if (options == null) return true;
            List<Long> ids = options.stream().filter(Objects::nonNull)
                    .map(AnswerOptionRequest::id).filter(Objects::nonNull).toList();
            return new HashSet<>(ids).size() == ids.size();
        }
    }

    public record QuestionResponse(
            Long id,
            Long lessonId,
            String questionText,
            String explanation,
            String difficulty,
            List<AnswerOptionResponse> options,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            boolean inUse) {}

}
