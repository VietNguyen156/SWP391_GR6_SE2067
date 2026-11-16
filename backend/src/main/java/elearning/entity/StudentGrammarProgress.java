package elearning.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_grammar_progress")
@IdClass(StudentGrammarProgressId.class)
public class StudentGrammarProgress {
    public enum Status {
        NOT_STARTED,
        LEARNING,
        COMPLETED
    }

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grammar_topic_id")
    private GrammarTopic grammarTopic;

    @Column(name = "progress_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal progressPercent = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.NOT_STARTED;

    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

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

    public BigDecimal getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(BigDecimal v) {
        progressPercent = v;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status v) {
        status = v;
    }

    public LocalDateTime getLastAccessedAt() {
        return lastAccessedAt;
    }

    public void setLastAccessedAt(LocalDateTime v) {
        lastAccessedAt = v;
    }
}
