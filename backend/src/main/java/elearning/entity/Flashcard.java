package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
public class Flashcard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flashcard_set_id", nullable = false)
    private FlashcardSet flashcardSet;

    @Column(name = "front_text", nullable = false, length = 500)
    private String frontText;

    @Column(name = "back_text", nullable = false, columnDefinition = "TEXT")
    private String backText;

    @Column(length = 255)
    private String pronunciation;

    @Column(name = "word_type", length = 100)
    private String wordType;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "audio_url", length = 1000)
    private String audioUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime n = LocalDateTime.now();
        if (createdAt == null) createdAt = n;
        updatedAt = n;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long v) {
        id = v;
    }

    public FlashcardSet getFlashcardSet() {
        return flashcardSet;
    }

    public void setFlashcardSet(FlashcardSet v) {
        flashcardSet = v;
    }

    public String getFrontText() {
        return frontText;
    }

    public void setFrontText(String v) {
        frontText = v;
    }

    public String getBackText() {
        return backText;
    }

    public void setBackText(String v) {
        backText = v;
    }

    public String getPronunciation() {
        return pronunciation;
    }

    public void setPronunciation(String v) {
        pronunciation = v;
    }

    public String getWordType() {
        return wordType;
    }

    public void setWordType(String v) {
        wordType = v;
    }

    public String getExampleSentence() {
        return exampleSentence;
    }

    public void setExampleSentence(String v) {
        exampleSentence = v;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String v) {
        imageUrl = v;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String v) {
        audioUrl = v;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer v) {
        sortOrder = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
