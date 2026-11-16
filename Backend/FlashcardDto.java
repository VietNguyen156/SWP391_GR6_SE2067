package elearning.dto;

import elearning.entity.FlashcardProgress;
import elearning.entity.FlashcardSet;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public final class FlashcardDto {
    private FlashcardDto() {}

    public record FlashcardProgressRequest(@NotNull FlashcardProgress.MemoryStatus memoryStatus) {}

    public record FlashcardRequest(
            Long id,
            @NotBlank @Size(max = 500) String frontText,
            @NotBlank String backText,
            @Size(max = 255) String pronunciation,
            @Size(max = 100) String wordType,
            String exampleSentence,
            @Size(max = 1000) String imageUrl,
            @Size(max = 1000) String audioUrl,
            @Positive Integer sortOrder) {}

    public record FlashcardResponse(
            Long id,
            String frontText,
            String backText,
            String pronunciation,
            String wordType,
            String exampleSentence,
            String imageUrl,
            String audioUrl,
            Integer sortOrder,
            String memoryStatus,
            Integer reviewCount,
            LocalDateTime lastReviewedAt,
            LocalDateTime nextReviewAt) {}

    public record FlashcardSetRequest(
            Long courseWeekId,
            Long lessonId,
            @NotBlank @Size(max = 200) String title,
            String description,
            @Size(max = 150) String topic,
            FlashcardSet.ToeicPart toeicPart,
            FlashcardSet.Difficulty difficulty,
            List<@Valid FlashcardRequest> cards) {}

    public record FlashcardSetResponse(
            Long id,
            Long ownerId,
            Long courseWeekId,
            Long lessonId,
            String ownerName,
            boolean personal,
            String title,
            String description,
            String topic,
            String toeicPart,
            String difficulty,
            String status,
            List<FlashcardResponse> cards,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            /** Đã có học viên ôn tập → không xóa được bộ (chỉ có ý nghĩa với giáo viên). */
            boolean inUse) {}

    public record FlashcardSetSummaryResponse(
            Long id,
            Long courseWeekId,
            Long lessonId,
            String title,
            String description,
            String topic,
            String toeicPart,
            String difficulty,
            String status,
            long cardCount,
            boolean personal,
            LocalDateTime updatedAt,
            boolean inUse) {}
}
