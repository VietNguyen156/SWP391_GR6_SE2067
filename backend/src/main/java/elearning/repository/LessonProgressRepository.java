package elearning.repository;

import elearning.entity.LessonProgress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<LessonProgress> findAllByStudentId(Long studentId);

    long countByStudentIdAndLessonCourseWeekCourseIdAndStatus(
            Long studentId, Long courseId, LessonProgress.Status status);

    long countByStatus(LessonProgress.Status status);

    long countByLessonIdAndStatusAndStudentIdIn(
            Long lessonId, LessonProgress.Status status, List<Long> studentIds);
}
