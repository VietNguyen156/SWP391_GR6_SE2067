package elearning.repository;

import elearning.entity.CourseOrder;
import elearning.entity.OrderStatusHistory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {
    List<OrderStatusHistory> findAllByOrderIdOrderByCreatedAtAscIdAsc(Long orderId);

    Optional<OrderStatusHistory> findFirstByOrderIdAndToStatusOrderByCreatedAtDescIdDesc(
            Long orderId, CourseOrder.Status toStatus);
}
