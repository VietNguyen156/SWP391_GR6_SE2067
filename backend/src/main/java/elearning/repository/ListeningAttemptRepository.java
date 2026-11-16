package elearning.repository;

import elearning.entity.ListeningAttempt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ListeningAttemptRepository extends JpaRepository<ListeningAttempt, Long> {
    Optional<ListeningAttempt> findTopByActivityIdAndStudentIdOrderBySubmittedAtDesc(
            Long activityId, Long studentId);

    boolean existsByActivityId(Long activityId);

    long countByActivityId(Long activityId);

    boolean existsByActivityIdAndStudentId(Long activityId, Long studentId);

    List<ListeningAttempt> findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
            Long courseId, Collection<Long> studentIds);
}
