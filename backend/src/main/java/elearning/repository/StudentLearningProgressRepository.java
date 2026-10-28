package elearning.repository;

import elearning.entity.StudentLearningProgress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface StudentLearningProgressRepository
        extends JpaRepository<StudentLearningProgress, Long> {
    Optional<StudentLearningProgress> findByStudentIdAndCourseId(Long studentId, Long courseId);

    List<StudentLearningProgress> findAllByStudentIdOrderByLastLearningTimeDesc(Long studentId);

    List<StudentLearningProgress> findAllByCourseId(Long courseId);
}
