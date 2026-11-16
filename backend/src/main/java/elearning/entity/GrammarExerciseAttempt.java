package elearning.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Một lượt làm bài tập của học viên; được làm lại không giới hạn, mỗi lượt lưu riêng. */
@Entity
@Table(name = "grammar_exercise_attempts")
public class GrammarExerciseAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grammar_topic_id", nullable = false)
    private GrammarTopic grammarTopic;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount = 0;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount = 0;

    /** Ngưỡng đạt tại thời điểm làm bài (giáo viên có thể đổi ngưỡng sau này). */
    @Column(name = "pass_score", nullable = false)
    private Integer passScore = 70;

    @Column(nullable = false)
    private boolean passed;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    void pre() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
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

    public GrammarTopic getGrammarTopic() {
        return grammarTopic;
    }

    public void setGrammarTopic(GrammarTopic v) {
        grammarTopic = v;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal v) {
        score = v;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer v) {
        correctCount = v;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Integer v) {
        totalCount = v;
    }

    public Integer getPassScore() {
        return passScore;
    }

    public void setPassScore(Integer v) {
        passScore = v;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean v) {
        passed = v;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
}
