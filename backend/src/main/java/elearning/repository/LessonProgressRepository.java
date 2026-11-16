package elearning.repository;

import elearning.entity.LessonProgress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    boolean existsByLessonId(Long lessonId);

    Optional<LessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<LessonProgress> findAllByStudentId(Long studentId);

    /** Bài đã hoàn thành trong số bài học viên đang thấy (cùng tập với mẫu số tiến độ). */
    long countByStudentIdAndLessonCourseWeekCourseIdAndStatusAndLessonStatusAndLessonCourseWeekStatus(
            Long studentId,
            Long courseId,
            LessonProgress.Status status,
            elearning.entity.Lesson.Status lessonStatus,
            elearning.entity.CourseWeek.Status weekStatus);

    long countByStatus(LessonProgress.Status status);

    long countByLessonIdAndStatusAndStudentIdIn(
            Long lessonId, LessonProgress.Status status, List<Long> studentIds);
}
