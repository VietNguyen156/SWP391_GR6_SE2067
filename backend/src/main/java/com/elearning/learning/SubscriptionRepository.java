package com.elearning.learning;

import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    @Query("select count(s) > 0 from Subscription s where s.student.id = :studentId and s.tuitionPackage.id = :packageId and (s.status = 'PENDING' or (s.status = 'ACTIVE' and (s.endAt is null or s.endAt > :now)))")
    boolean hasCurrentSubscription(@Param("studentId") Long studentId, @Param("packageId") Long packageId, @Param("now") java.time.LocalDateTime now);
}

