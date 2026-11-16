package elearning.dto;

import elearning.entity.ListeningQuestion;

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
            /** Toàn văn bài nghe (tùy chọn); học viên chỉ thấy sau khi nộp bài chính thức. */
            @Size(max = 65535) String transcript,
            List<@NotNull @Valid Question> questions) {
        public record Question(
                @NotBlank String questionText,
                @NotNull @Size(min = 2) List<@NotNull @Valid Option> options,
                /** Mặc định DETAIL khi để trống. */
                ListeningQuestion.SkillType skillType,
                @Size(max = 65535) String explanation,
                @Size(max = 65535) String transcriptExcerpt,
                @PositiveOrZero Integer audioStartSec,
                @PositiveOrZero Integer audioEndSec) {
            @AssertTrue(message = "Mỗi câu hỏi phải có đúng một đáp án đúng")
            public boolean isExactlyOneCorrect() {
                return options != null && options.stream().allMatch(Objects::nonNull)
                        && options.stream().filter(Option::correct).count() == 1;
            }

            @AssertTrue(message = "Thời điểm kết thúc đoạn nghe phải sau thời điểm bắt đầu")
            public boolean isAudioWindowValid() {
                if (audioEndSec == null) return true;
                return audioStartSec != null && audioEndSec > audioStartSec;
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
            String status,
            List<Question> questions,
            /** Đã có học viên nộp bài → không sửa/xóa được (chỉ có ý nghĩa với giáo viên). */
            boolean inUse,
            /** Số lượt học viên đã nộp (giáo viên). */
            long attemptCount,
            /** Chỉ có ở bản của giáo viên; học viên nhận trong kết quả sau khi nộp. */
            String transcript) {
        /**
         * explanation / transcriptExcerpt / audio window chỉ có ở bản của giáo viên; học viên nhận
         * trong kết quả sau khi nộp.
         */
        public record Question(
                Long id,
                String questionText,
                List<Option> options,
                ListeningQuestion.SkillType skillType,
                String explanation,
                String transcriptExcerpt,
                Integer audioStartSec,
                Integer audioEndSec) {}

        public record Option(Long id, String optionText, boolean correct) {}
    }

    public record QuestionReview(
            String explanation,
            String transcriptExcerpt,
            Integer audioStartSec,
            Integer audioEndSec) {}

    public record SkillAnalysis(int correct, int total, BigDecimal score) {}

    public record ListeningResultResponse(
            Long attemptId,
            BigDecimal score,
            int correct,
            int total,
            java.time.LocalDateTime submittedAt,
            Map<Long, Long> answers,
            /** Đáp án đúng của từng câu (id câu → id đáp án); chỉ có trong kết quả sau khi nộp. */
            Map<Long, Long> correctAnswers,
            /** Câu → giải thích, đoạn transcript, khoảng audio (chỉ sau khi nộp). */
            Map<Long, QuestionReview> reviews,
            /** Toàn văn bài nghe, chỉ trả khi đây là kết quả của lượt chính thức. */
            String transcript,
            String attemptType,
            String skillType,
            Map<String, SkillAnalysis> skillAnalysis) {}

    /** Một dòng trong lịch sử các lần làm của học viên. */
    public record AttemptSummary(
            Long attemptId,
            String attemptType,
            String skillType,
            BigDecimal score,
            int correct,
            int total,
            java.time.LocalDateTime submittedAt) {}

    public record ListeningSubmitRequest(Map<Long, Long> answers) {}
}
