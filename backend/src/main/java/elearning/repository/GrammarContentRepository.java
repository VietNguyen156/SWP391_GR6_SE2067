package elearning.repository;

import elearning.entity.GrammarContent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface GrammarContentRepository extends JpaRepository<GrammarContent, Long> {
    List<GrammarContent> findAllByGrammarTopicIdOrderBySortOrderAsc(Long topicId);

    Optional<GrammarContent> findTopByGrammarTopicIdOrderBySortOrderDesc(Long topicId);

    boolean existsByGrammarTopicIdAndSortOrder(Long topicId, Integer sortOrder);

    boolean existsByGrammarTopicIdAndSortOrderAndIdNot(Long topicId, Integer sortOrder, Long id);
}
