package com.elearning.learning;

import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudyClassIdOrderByEnrolledAtDesc(Long classId);
    List<Enrollment> findByStudentIdAndStatusOrderByEnrolledAtDesc(Long studentId, String status);
    boolean existsByStudyClassIdAndStudentId(Long classId, Long studentId);
    long countByStudyClassIdAndStatus(Long classId, String status);
}

