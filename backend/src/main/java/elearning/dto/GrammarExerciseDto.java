package elearning.dto;

import elearning.entity.GrammarExercise;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class GrammarExerciseDto {
    private GrammarExerciseDto() {}

    // ---- Giáo viên soạn bài tập ----

    public record OptionRequest(@NotBlank String optionText, boolean correct) {}

    public record ExerciseRequest(
            @NotNull GrammarExercise.Type type,
            @NotBlank String questionText,
            /** Điền chỗ trống: các đáp án chấp nhận, ngăn cách bằng dấu |. */
            String correctAnswer,
            @Size(max = 65535) String explanation,
            List<@NotNull @Valid OptionRequest> options) {
        @AssertTrue(
                message =
                        "Câu trắc nghiệm cần 2–4 đáp án, đúng một đáp án đúng; câu điền chỗ trống cần ít nhất một đáp án chấp nhận")
        public boolean isValidForType() {
            if (type == GrammarExercise.Type.FILL_BLANK) {
                return correctAnswer != null && !correctAnswer.isBlank();
            }
            return options != null
                    && options.size() >= 2
                    && options.size() <= 4
                    && options.stream().allMatch(Objects::nonNull)
                    && options.stream().filter(OptionRequest::correct).count() == 1;
        }
    }

    public record SaveExercisesRequest(
            @NotNull @Min(1) @Max(100) Integer passScore,
            @NotNull List<@NotNull @Valid ExerciseRequest> exercises) {}

    public record TeacherOption(Long id, String optionText, boolean correct) {}

    public record TeacherExercise(
            Long id,
            String type,
            String questionText,
            String correctAnswer,
            String explanation,
            List<TeacherOption> options) {}

    public record TeacherExercisesResponse(
            Long topicId,
            int passScore,
            /** Đã có học viên làm bài tập → không sửa được để bảo toàn kết quả. */
            boolean locked,
            List<TeacherExercise> exercises) {}

    // ---- Học viên làm bài ----

    public record StudentOption(Long id, String optionText) {}

    public record StudentExercise(
            Long id, String type, String questionText, List<StudentOption> options) {}

    public record StudentExercisesResponse(
            Long topicId,
            int passScore,
            String mastery,
            BigDecimal bestScore,
            BigDecimal lastScore,
            int attemptCount,
            List<StudentExercise> exercises) {}

    public record ExerciseAnswer(Long optionId, String text) {}

    public record SubmitRequest(Map<Long, ExerciseAnswer> answers) {}

    public record ItemResult(
            Long exerciseId,
            boolean correct,
            Long selectedOptionId,
            String answerText,
            Long correctOptionId,
            String correctAnswer,
            String explanation) {}

    public record AttemptResult(
            Long attemptId,
            BigDecimal score,
            int correct,
            int total,
            boolean passed,
            int passScore,
            LocalDateTime submittedAt,
            String mastery,
            String progressStatus,
            List<ItemResult> items) {}

    public record AttemptSummary(
            Long attemptId,
            BigDecimal score,
            int correct,
            int total,
            boolean passed,
            LocalDateTime submittedAt) {}

    // ---- Thống kê lỗi ----

    public record ExerciseStat(
            Long exerciseId, String questionText, int answered, int wrong, BigDecimal wrongRate) {}

    public record TopicStats(
            Long topicId,
            String title,
            int exerciseCount,
            int attemptCount,
            int studentCount,
            int passedStudentCount,
            BigDecimal averageScore,
            BigDecimal passRate,
            List<ExerciseStat> hardestExercises) {}
}
