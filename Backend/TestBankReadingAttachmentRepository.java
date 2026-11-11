package elearning.repository;

import elearning.entity.TestBankReadingAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestBankReadingAttachmentRepository
        extends JpaRepository<TestBankReadingAttachment, Long> {
    List<TestBankReadingAttachment> findAllByItemIdOrderBySortOrderAsc(Long itemId);

    long countByItemId(Long itemId);
}
