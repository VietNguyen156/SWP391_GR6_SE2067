package elearning.repository;

import elearning.entity.ListeningAttempt;
import elearning.entity.ListeningQuestion;

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

    List<ListeningAttempt> findAllByTypeAndActivityCourseWeekCourseIdIn(
            ListeningAttempt.Type type, Collection<Long> courseIds);

    List<ListeningAttempt> findAllByActivityIdAndStudentIdOrderBySubmittedAtDescIdDesc(
            Long activityId, Long studentId);

    Optional<ListeningAttempt>
            findFirstByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDescIdDesc(
                    Long activityId,
                    Long studentId,
                    ListeningAttempt.Type type,
                    ListeningQuestion.SkillType practiceSkill);

    List<ListeningAttempt>
            findAllByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDescIdDesc(
                    Long activityId,
                    Long studentId,
                    ListeningAttempt.Type type,
                    ListeningQuestion.SkillType practiceSkill);

    List<ListeningAttempt>
            findAllByStudentIdAndTypeAndActivityCourseWeekCourseIdInOrderBySubmittedAtDesc(
                    Long studentId, ListeningAttempt.Type type, Collection<Long> courseIds);

    List<ListeningAttempt> findAllByStudentIdAndActivityCourseWeekCourseIdInOrderBySubmittedAtDesc(
            Long studentId, Collection<Long> courseIds);

    Optional<ListeningAttempt> findFirstByActivityIdAndStudentIdAndAssessmentSlot(
            Long activityId, Long studentId, Integer assessmentSlot);

    boolean existsByActivityIdAndStudentIdAndAssessmentSlot(
            Long activityId, Long studentId, Integer assessmentSlot);
}
