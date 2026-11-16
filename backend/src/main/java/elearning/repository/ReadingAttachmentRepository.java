package elearning.repository;

import elearning.entity.ReadingAttachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReadingAttachmentRepository extends JpaRepository<ReadingAttachment, Long> {
    List<ReadingAttachment> findAllByActivityIdOrderBySortOrderAsc(Long activityId);

    long countByActivityId(Long activityId);

    boolean existsByUrl(String url);
}
