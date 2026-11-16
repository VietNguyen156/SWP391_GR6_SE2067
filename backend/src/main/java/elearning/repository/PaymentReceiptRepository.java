package elearning.repository;

import elearning.entity.PaymentReceipt;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentReceiptRepository extends JpaRepository<PaymentReceipt, Long> {
    Optional<PaymentReceipt> findByOrderId(Long orderId);

    /** Khoản tiền theo thời điểm tiền vào (from ≤ receivedAt < to); null = không giới hạn. */
    @Query(
            "select r from PaymentReceipt r join fetch r.order o join fetch o.course join fetch o.student"
                    + " where (:from is null or r.receivedAt >= :from) and (:to is null or r.receivedAt < :to)"
                    + " order by r.receivedAt")
    List<PaymentReceipt> findReceived(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
