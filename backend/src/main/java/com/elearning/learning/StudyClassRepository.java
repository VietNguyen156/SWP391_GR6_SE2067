package com.elearning.learning;

import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface StudyClassRepository extends JpaRepository<StudyClass, Long> {
    List<StudyClass> findByMentorIdOrderByCreatedAtDesc(Long mentorId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from StudyClass c where c.id = :id")
    Optional<StudyClass> lockById(@Param("id") Long id);
}

