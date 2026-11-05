package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "listening_answers",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_listening_answer",
                        columnNames = {"attempt_id", "question_id"}))
public class ListeningAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ListeningAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private ListeningQuestion question;

    // The supplied database stores the active answer in option_id. selected_option_id is a legacy
    // column and is intentionally left untouched so existing data is preserved.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id")
    private ListeningOption option;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    public Long getId() {
        return id;
    }

    public ListeningAttempt getAttempt() {
        return attempt;
    }

    public void setAttempt(ListeningAttempt v) {
        attempt = v;
    }

    public ListeningQuestion getQuestion() {
        return question;
    }

    public void setQuestion(ListeningQuestion v) {
        question = v;
    }

    public ListeningOption getOption() {
        return option;
    }

    public void setOption(ListeningOption v) {
        option = v;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean v) {
        correct = v;
    }
}
