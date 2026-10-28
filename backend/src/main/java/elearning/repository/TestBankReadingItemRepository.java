package elearning.repository;

import elearning.entity.TestBankReadingItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestBankReadingItemRepository extends JpaRepository<TestBankReadingItem, Long> {
    List<TestBankReadingItem> findAllByTeacherIdOrderByUpdatedAtDesc(Long teacherId);
}
