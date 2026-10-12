package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "answer_submissions")
public class AnswerSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_answer_id")
    private AnswerOption selectedAnswer;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    void prePersist() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public QuizAttempt getAttempt() {
        return attempt;
    }

    public void setAttempt(QuizAttempt v) {
        attempt = v;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question v) {
        question = v;
    }

    public AnswerOption getSelectedAnswer() {
        return selectedAnswer;
    }

    public void setSelectedAnswer(AnswerOption v) {
        selectedAnswer = v;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean v) {
        correct = v;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime v) {
        submittedAt = v;
    }
}
