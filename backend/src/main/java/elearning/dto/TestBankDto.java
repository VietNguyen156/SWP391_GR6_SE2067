package elearning.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Objects;

/** Ngân hàng đề thi: Nghe / Đọc / Nói dùng riêng cho Test cuối khóa, không thuộc khóa học hay bài học. */
public final class TestBankDto {
    private TestBankDto() {}

    public record Option(@NotBlank String optionText, boolean correct) {}

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

    public record ListeningRequest(
            @NotBlank @Size(max = 200) String title,
            String instruction,
            String audioUrl,
            List<@NotNull @Valid Question> questions) {}

    public record ReadingRequest(
            @NotBlank @Size(max = 200) String title,
            String instruction,
            String passage,
            String passageFormat,
            String toeicPart,
            String passageType,
            List<@NotNull @Valid Question> questions) {}

    public record SpeakingRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank String instruction,
            String promptText) {}

    /** Bộ đề: danh sách câu hỏi (theo thứ tự) của ngân hàng câu hỏi, chọn cả bộ vào một phần Test. */
    public record QuestionSetRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            @NotNull @jakarta.validation.constraints.NotEmpty List<@NotNull Long> questionIds) {}

    public record QuestionRef(Long id, String questionText) {}

    public record QuestionSetResponse(
            Long id,
            String title,
            String description,
            String status,
            List<QuestionRef> questions,
            long usedBy) {}

    public record OptionView(Long id, String optionText, boolean correct) {}

    public record QuestionView(
            Long id, String questionText, String explanation, String evidence, List<OptionView> options) {}

    public record ListeningResponse(
            Long id,
            String title,
            String instruction,
            String audioUrl,
            String status,
            List<QuestionView> questions,
            /** Số phần Test đang dùng mục này (mọi phiên bản). */
            long usedBy) {}

    public record ReadingResponse(
            Long id,
            String title,
            String instruction,
            String passage,
            String passageFormat,
            String toeicPart,
            String passageType,
            String status,
            List<QuestionView> questions,
            List<GrammarDto.AttachmentResponse> attachments,
            long usedBy) {}

    public record SpeakingResponse(
            Long id, String title, String instruction, String promptText, String status, long usedBy) {}
}
