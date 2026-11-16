package elearning.repository;

import elearning.entity.GrammarExerciseAnswer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface GrammarExerciseAnswerRepository
        extends JpaRepository<GrammarExerciseAnswer, Long> {
    List<GrammarExerciseAnswer> findAllByAttemptId(Long attemptId);

    List<GrammarExerciseAnswer> findAllByAttemptIdIn(Collection<Long> attemptIds);
}
