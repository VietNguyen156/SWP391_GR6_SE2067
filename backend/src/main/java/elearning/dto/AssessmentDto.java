package elearning.dto;

import elearning.entity.Question;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.List;

public final class AssessmentDto {
    private AssessmentDto() {}

    public record AnswerOptionRequest(Long id, @NotBlank String content, boolean correct) {}

    public record AnswerOptionResponse(
            Long id, String content, boolean correct, Integer sortOrder) {}

    public record AnswerReviewResponse(
            Long questionId,
            String questionText,
            Long selectedAnswerId,
            String selectedAnswer,
            Long correctAnswerId,
            String correctAnswer,
            String explanation,
            boolean correct) {}

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
            /** Thuộc quiz đã có lượt làm → không sửa được. */
            boolean inUse) {}

    public record QuizRequest(
            @NotBlank @Size(max = 220) String title,
            String description,
            Long courseId,
            Long lessonId,
            @NotNull @Min(1) @Max(300) Integer timeLimitMinutes,
            @NotEmpty List<@NotNull Long> questionIds) {
        @AssertTrue(message = "Danh sách câu hỏi không được trùng")
        public boolean isQuestionListUnique() {
            return questionIds != null && new HashSet<>(questionIds).size() == questionIds.size();
        }
    }

    public record QuizResponse(
            Long id,
            String title,
            String description,
            Long courseId,
            String courseTitle,
            Long courseWeekId,
            Long lessonId,
            String lessonTitle,
            Integer timeLimitMinutes,
            Integer totalQuestion,
            String status,
            List<QuestionResponse> questions,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            /** Đã có lượt làm → không sửa/xóa được. */
            boolean inUse) {}

    public record QuizSummaryResponse(
            Long id,
            String title,
            String description,
            Long courseId,
            String courseTitle,
            Long courseWeekId,
            Long lessonId,
            String lessonTitle,
            Integer timeLimitMinutes,
            Integer totalQuestion,
            String status,
            LocalDateTime updatedAt,
            boolean inUse) {}

    public record ResultDetailResponse(
            Long id,
            Long quizId,
            String quizTitle,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal score,
            Integer totalQuestions,
            Integer correctAnswers,
            Integer wrongAnswers,
            String status,
            List<AnswerReviewResponse> answers) {}

    public record ResultSummaryResponse(
            Long id,
            Long quizId,
            String quizTitle,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal score,
            Integer totalQuestions,
            Integer correctAnswers,
            Integer wrongAnswers,
            String status) {}

    public record StartAttemptResponse(
            Long attemptId,
            Long quizId,
            String quizTitle,
            Integer timeLimitMinutes,
            LocalDateTime startTime,
            LocalDateTime expiresAt,
            List<StudentQuestionResponse> questions,
            Map<Long, Long> savedAnswers,
            /** Lượt cũ đã quá giờ và vừa được tự nộp trước khi bắt đầu lượt này (null nếu không có). */
            Long autoSubmittedAttemptId) {}

    public record StudentOptionResponse(Long id, String content, Integer sortOrder) {}

    public record StudentQuestionResponse(
            Long id,
            String questionText,
            String difficulty,
            List<StudentOptionResponse> options) {}

    public record StudentQuizResponse(
            Long id,
            String title,
            String description,
            Long courseId,
            String courseTitle,
            Long courseWeekId,
            Long lessonId,
            String lessonTitle,
            Integer timeLimitMinutes,
            Integer totalQuestion,
            List<StudentQuestionResponse> questions,
            /** Lượt đang làm còn hạn (để "Tiếp tục"), lượt đã nộp gần nhất và điểm tốt nhất. */
            Long inProgressAttemptId,
            Long lastAttemptId,
            BigDecimal bestScore) {}

    public record SubmitAnswerRequest(@NotNull Long questionId, @NotNull Long selectedAnswerId) {}

    public record SubmitAnswerResponse(
            Long attemptId, Long questionId, Long selectedAnswerId, LocalDateTime savedAt) {}
}
