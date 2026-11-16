package elearning.repository;

import elearning.entity.TestBankSpeakingItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestBankSpeakingItemRepository extends JpaRepository<TestBankSpeakingItem, Long> {
    List<TestBankSpeakingItem> findAllByTeacherIdOrderByUpdatedAtDesc(Long teacherId);
}
