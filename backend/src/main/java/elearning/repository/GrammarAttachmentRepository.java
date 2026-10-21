package elearning.repository;

import elearning.entity.GrammarAttachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GrammarAttachmentRepository extends JpaRepository<GrammarAttachment, Long> {
    List<GrammarAttachment> findAllByGrammarTopicIdOrderBySortOrderAsc(Long topicId);

    List<GrammarAttachment> findAllByGrammarContentIdOrderBySortOrderAsc(Long contentId);

    long countByGrammarContentId(Long contentId);

    boolean existsByUrl(String url);
}
