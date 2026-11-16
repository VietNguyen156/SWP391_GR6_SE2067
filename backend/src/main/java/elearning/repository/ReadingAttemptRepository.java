package elearning.repository;

import elearning.entity.ReadingAttempt;
import elearning.entity.ReadingQuestion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReadingAttemptRepository extends JpaRepository<ReadingAttempt, Long> {
    Optional<ReadingAttempt> findFirstByActivityIdAndStudentIdAndAssessmentSlot(
            Long activityId, Long studentId, Integer assessmentSlot);

    List<ReadingAttempt>
            findAllByStudentIdAndTypeAndActivityCourseWeekCourseIdInOrderBySubmittedAtDesc(
                    Long studentId, ReadingAttempt.Type type, Collection<Long> courseIds);

    Optional<ReadingAttempt>
            findFirstByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDesc(
                    Long activityId,
                    Long studentId,
                    ReadingAttempt.Type type,
                    ReadingQuestion.SkillType practiceSkill);

    List<ReadingAttempt> findAllByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDesc(
            Long activityId,
            Long studentId,
            ReadingAttempt.Type type,
            ReadingQuestion.SkillType practiceSkill);

    Optional<ReadingAttempt> findTopByActivityIdAndStudentIdOrderBySubmittedAtDesc(
            Long activityId, Long studentId);

    boolean existsByActivityId(Long activityId);

    long countByActivityId(Long activityId);

    boolean existsByActivityIdAndStudentId(Long activityId, Long studentId);

    List<ReadingAttempt> findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
            Long courseId, Collection<Long> studentIds);

    List<ReadingAttempt>
            findAllByActivityCourseWeekCourseIdAndStudentIdInAndTypeOrderBySubmittedAtDesc(
                    Long courseId, Collection<Long> studentIds, ReadingAttempt.Type type);
}
