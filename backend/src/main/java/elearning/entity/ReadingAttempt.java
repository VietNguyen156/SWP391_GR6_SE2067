package elearning.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Một lượt làm bài Reading: lượt đánh giá chính thức hoặc lượt luyện một kỹ năng. */
@Entity
@Table(
        name = "reading_attempts",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_reading_assessment_slot",
                        columnNames = {"reading_id", "student_id", "assessment_slot"}))
public class ReadingAttempt {
    public enum Type {
        ASSESSMENT,
        TARGETED_PRACTICE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reading_id", nullable = false)
    private ReadingActivity activity;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    private BigDecimal score;

    @Enumerated(EnumType.STRING)
    @Column(name = "attempt_type", nullable = false, length = 30)
    private Type type = Type.ASSESSMENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "practice_skill", length = 30)
    private ReadingQuestion.SkillType practiceSkill;

    @Column(name = "assessment_slot")
    private Integer assessmentSlot;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    void pre() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public ReadingActivity getActivity() {
        return activity;
    }

    public void setActivity(ReadingActivity v) {
        activity = v;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User v) {
        student = v;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal v) {
        score = v;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type v) {
        type = v;
    }

    public ReadingQuestion.SkillType getPracticeSkill() {
        return practiceSkill;
    }

    public void setPracticeSkill(ReadingQuestion.SkillType v) {
        practiceSkill = v;
    }

    public Integer getAssessmentSlot() {
        return assessmentSlot;
    }

    public void setAssessmentSlot(Integer v) {
        assessmentSlot = v;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
}
