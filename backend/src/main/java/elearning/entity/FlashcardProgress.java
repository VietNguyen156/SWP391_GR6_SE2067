package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "flashcard_progress")
@IdClass(FlashcardProgressId.class)
public class FlashcardProgress {
    public enum MemoryStatus {
        NEW,
        LEARNING,
        REMEMBERED,
        REVIEW
    }

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flashcard_id")
    private Flashcard flashcard;

    @Enumerated(EnumType.STRING)
    @Column(name = "memory_status", nullable = false, length = 20)
    private MemoryStatus memoryStatus = MemoryStatus.NEW;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    @Column(name = "next_review_at")
    private LocalDateTime nextReviewAt;

    public User getStudent() {
        return student;
    }

    public void setStudent(User v) {
        student = v;
    }

    public Flashcard getFlashcard() {
        return flashcard;
    }

    public void setFlashcard(Flashcard v) {
        flashcard = v;
    }

    public MemoryStatus getMemoryStatus() {
        return memoryStatus;
    }

    public void setMemoryStatus(MemoryStatus v) {
        memoryStatus = v;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer v) {
        reviewCount = v;
    }

    public LocalDateTime getLastReviewedAt() {
        return lastReviewedAt;
    }

    public void setLastReviewedAt(LocalDateTime v) {
        lastReviewedAt = v;
    }

    public LocalDateTime getNextReviewAt() {
        return nextReviewAt;
    }

    public void setNextReviewAt(LocalDateTime v) {
        nextReviewAt = v;
    }
}
