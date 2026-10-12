package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "learning_history",
        uniqueConstraints =
                @UniqueConstraint(columnNames = {"student_id", "activity_type", "activity_id"}))
public class LearningHistory {
    public enum ActivityType {
        LESSON,
        GRAMMAR,
        VOCABULARY,
        FLASHCARD,
        QUIZ
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 20)
    private ActivityType activityType;

    @Column(name = "activity_id", nullable = false)
    private Long activityId;

    @Column(name = "activity_name", nullable = false, length = 255)
    private String activityName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User v) {
        student = v;
    }

    public ActivityType getActivityType() {
        return activityType;
    }

    public void setActivityType(ActivityType v) {
        activityType = v;
    }

    public Long getActivityId() {
        return activityId;
    }

    public void setActivityId(Long v) {
        activityId = v;
    }

    public String getActivityName() {
        return activityName;
    }

    public void setActivityName(String v) {
        activityName = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime v) {
        createdAt = v;
    }
}
