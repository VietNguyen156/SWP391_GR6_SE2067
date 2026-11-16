package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "grammar_exercise_answers")
public class GrammarExerciseAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private GrammarExerciseAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private GrammarExercise exercise;

    /** Trắc nghiệm: đáp án đã chọn (null nếu bỏ trống). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id")
    private GrammarExerciseOption option;

    /** Điền chỗ trống: chuỗi học viên nhập. */
    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    public Long getId() {
        return id;
    }

    public GrammarExerciseAttempt getAttempt() {
        return attempt;
    }

    public void setAttempt(GrammarExerciseAttempt v) {
        attempt = v;
    }

    public GrammarExercise getExercise() {
        return exercise;
    }

    public void setExercise(GrammarExercise v) {
        exercise = v;
    }

    public GrammarExerciseOption getOption() {
        return option;
    }

    public void setOption(GrammarExerciseOption v) {
        option = v;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String v) {
        answerText = v;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean v) {
        correct = v;
    }
}
