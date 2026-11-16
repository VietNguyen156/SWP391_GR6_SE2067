package elearning.entity;

import java.io.Serializable;
import java.util.Objects;

public class FlashcardProgressId implements Serializable {
    private Long student;
    private Long flashcard;

    public FlashcardProgressId() {}

    public FlashcardProgressId(Long s, Long f) {
        student = s;
        flashcard = f;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FlashcardProgressId that)) return false;
        return Objects.equals(student, that.student) && Objects.equals(flashcard, that.flashcard);
    }

    @Override
    public int hashCode() {
        return Objects.hash(student, flashcard);
    }
}
