package elearning.repository;

import elearning.entity.GrammarExerciseAttempt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface GrammarExerciseAttemptRepository
        extends JpaRepository<GrammarExerciseAttempt, Long> {
    List<GrammarExerciseAttempt> findAllByStudentIdAndGrammarTopicIdOrderBySubmittedAtDescIdDesc(
            Long studentId, Long topicId);

    List<GrammarExerciseAttempt> findAllByGrammarTopicId(Long topicId);

    List<GrammarExerciseAttempt> findAllByGrammarTopicIdIn(Collection<Long> topicIds);

    boolean existsByGrammarTopicId(Long topicId);
}
