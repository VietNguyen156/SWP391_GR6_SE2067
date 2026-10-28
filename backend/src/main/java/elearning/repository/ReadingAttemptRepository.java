package elearning.repository;

import elearning.entity.ReadingAttempt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReadingAttemptRepository extends JpaRepository<ReadingAttempt, Long> {
    Optional<ReadingAttempt> findTopByActivityIdAndStudentIdOrderBySubmittedAtDesc(
            Long activityId, Long studentId);

    boolean existsByActivityId(Long activityId);

    long countByActivityId(Long activityId);

    boolean existsByActivityIdAndStudentId(Long activityId, Long studentId);

    List<ReadingAttempt> findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
            Long courseId, Collection<Long> studentIds);
}
