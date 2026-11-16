package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "reading_answers",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_reading_answer",
                        columnNames = {"attempt_id", "question_id"}))
public class ReadingAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ReadingAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private ReadingQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id")
    private ReadingOption option;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    public Long getId() {
        return id;
    }

    public ReadingAttempt getAttempt() {
        return attempt;
    }

    public void setAttempt(ReadingAttempt v) {
        attempt = v;
    }

    public ReadingQuestion getQuestion() {
        return question;
    }

    public void setQuestion(ReadingQuestion v) {
        question = v;
    }

    public ReadingOption getOption() {
        return option;
    }

    public void setOption(ReadingOption v) {
        option = v;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean v) {
        correct = v;
    }
}
