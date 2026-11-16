package elearning.repository;

import elearning.entity.GrammarExercise;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface GrammarExerciseRepository extends JpaRepository<GrammarExercise, Long> {
    List<GrammarExercise> findAllByGrammarTopicIdOrderBySortOrderAsc(Long topicId);

    boolean existsByGrammarTopicId(Long topicId);

    long countByGrammarTopicId(Long topicId);

    List<GrammarExercise> findAllByGrammarTopicIdIn(Collection<Long> topicIds);
}
