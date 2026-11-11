package elearning.repository;

import elearning.entity.TestBankListeningItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestBankListeningItemRepository extends JpaRepository<TestBankListeningItem, Long> {
    List<TestBankListeningItem> findAllByTeacherIdOrderByUpdatedAtDesc(Long teacherId);
}
