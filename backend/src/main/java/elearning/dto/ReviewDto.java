package elearning.dto;

import java.util.List;

public final class ReviewDto {
    private ReviewDto() {}

    /**
     * Một học liệu trên trang Ôn tập. Vị trí (khóa/tuần/bài) là null với bộ flashcard cá nhân.
     * Flashcards: cardCount, reviewedCount (số thẻ đã ôn). Ngữ pháp: progressStatus
     * (NOT_STARTED / LEARNING / COMPLETED). Reading: progressStatus NOT_STARTED / COMPLETED (đã nộp).
     */
    public record ReviewItem(
            Long id,
            String title,
            String type,
            Long courseId,
            String courseTitle,
            Integer weekNumber,
            Long lessonId,
            Integer lessonNo,
            String lessonTitle,
            Integer cardCount,
            Integer reviewedCount,
            String progressStatus) {}

    public record ReviewResponse(
            List<ReviewItem> personalFlashcardSets,
            List<ReviewItem> grammar,
            List<ReviewItem> flashcardSets,
            List<ReviewItem> reading) {}
}
