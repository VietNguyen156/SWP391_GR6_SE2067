package elearning.repository;

import elearning.entity.SpeakingSubmission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface SpeakingSubmissionRepository extends JpaRepository<SpeakingSubmission, Long> {
    List<SpeakingSubmission> findAllByActivityIdOrderBySubmittedAtDesc(Long id);

    Optional<SpeakingSubmission> findByActivityIdAndStudentId(Long activityId, Long studentId);

    boolean existsByActivityId(Long activityId);

    long countByActivityId(Long activityId);

    long countByActivityIdAndStatus(Long activityId, SpeakingSubmission.Status status);

    List<SpeakingSubmission> findAllByActivityLessonIdAndStudentId(Long lessonId, Long studentId);

    List<SpeakingSubmission>
            findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
                    Long courseId, Collection<Long> studentIds);
}
