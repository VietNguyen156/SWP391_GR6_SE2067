package elearning.entity;

import java.io.Serializable;
import java.util.Objects;

public class QuizQuestionId implements Serializable {
    private Long quiz;
    private Long question;

    public QuizQuestionId() {}

    public boolean equals(Object o) {
        return o instanceof QuizQuestionId x
                && Objects.equals(quiz, x.quiz)
                && Objects.equals(question, x.question);
    }

    public int hashCode() {
        return Objects.hash(quiz, question);
    }
}
