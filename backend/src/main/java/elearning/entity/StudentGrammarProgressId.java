package elearning.entity;

import java.io.Serializable;
import java.util.Objects;

public class StudentGrammarProgressId implements Serializable {
    private Long student;
    private Long grammarTopic;

    public StudentGrammarProgressId() {}

    public StudentGrammarProgressId(Long student, Long grammarTopic) {
        this.student = student;
        this.grammarTopic = grammarTopic;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentGrammarProgressId that)) return false;
        return Objects.equals(student, that.student)
                && Objects.equals(grammarTopic, that.grammarTopic);
    }

    @Override
    public int hashCode() {
        return Objects.hash(student, grammarTopic);
    }
}
