package com.elearning.learning;

import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface TuitionPackageRepository extends JpaRepository<TuitionPackage, Long> {
    List<TuitionPackage> findByMentorIdOrderByCreatedAtDesc(Long mentorId);
    List<TuitionPackage> findByStatusOrderByCreatedAtDesc(String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from TuitionPackage p where p.id = :id")
    Optional<TuitionPackage> lockById(@Param("id") Long id);
}

