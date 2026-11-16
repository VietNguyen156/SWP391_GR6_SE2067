package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "flashcard_sets")
public class FlashcardSet {
    public enum ToeicPart {
        GENERAL,
        PART_1,
        PART_2,
        PART_3,
        PART_4,
        PART_5,
        PART_6,
        PART_7
    }

    public enum Difficulty {
        BEGINNER,
        EASY,
        MEDIUM,
        HARD,
        ADVANCED
    }

    public enum Status {
        DRAFT,
        PUBLISHED,
        HIDDEN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_week_id")
    private CourseWeek courseWeek;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 150)
    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "toeic_part", nullable = false, length = 20)
    private ToeicPart toeicPart = ToeicPart.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

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

    public User getCreatedByUser() {
        return createdByUser;
    }

    public void setCreatedByUser(User v) {
        createdByUser = v;
    }

    public CourseWeek getCourseWeek() {
        return courseWeek;
    }

    public void setCourseWeek(CourseWeek v) {
        courseWeek = v;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson v) {
        lesson = v;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String v) {
        topic = v;
    }

    public ToeicPart getToeicPart() {
        return toeicPart;
    }

    public void setToeicPart(ToeicPart v) {
        toeicPart = v;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty v) {
        difficulty = v;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status v) {
        status = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
