package elearning.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "listening_attempts",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_listening_assessment_slot",
                        columnNames = {"listening_id", "student_id", "assessment_slot"}))
public class ListeningAttempt {
    public enum Type {
        ASSESSMENT,
        TARGETED_PRACTICE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listening_id")
    private ListeningActivity activity;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    private BigDecimal score;

    @Enumerated(EnumType.STRING)
    @Column(name = "attempt_type", nullable = false, length = 30)
    private Type type = Type.ASSESSMENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "practice_skill", length = 30)
    private ListeningQuestion.SkillType practiceSkill;

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

    public ListeningActivity getActivity() {
        return activity;
    }

    public void setActivity(ListeningActivity v) {
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

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type v) {
        type = v;
    }

    public ListeningQuestion.SkillType getPracticeSkill() {
        return practiceSkill;
    }

    public void setPracticeSkill(ListeningQuestion.SkillType v) {
        practiceSkill = v;
    }

    public Integer getAssessmentSlot() {
        return assessmentSlot;
    }

    public void setAssessmentSlot(Integer v) {
        assessmentSlot = v;
    }
}
