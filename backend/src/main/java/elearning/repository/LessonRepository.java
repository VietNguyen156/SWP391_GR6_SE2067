package elearning.repository;

import elearning.entity.CourseWeek;
import elearning.entity.Lesson;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findAllByCourseWeekIdOrderBySortOrderAsc(Long courseWeekId);

    List<Lesson> findAllByCourseWeekCourseIdOrderByCourseWeekWeekNumberAscSortOrderAsc(Long courseId);

    Optional<Lesson> findTopByCourseWeekIdOrderBySortOrderDesc(Long courseWeekId);

    Optional<Lesson> findByIdAndCreatedByTeacherId(Long id, Long teacherId);

    long countByCourseWeekCourseId(Long courseId);

    /** Số bài học viên đang thấy: bài hiển thị nằm trong tuần hiển thị. */
    long countByCourseWeekCourseIdAndCourseWeekStatusAndStatus(
            Long courseId, CourseWeek.Status weekStatus, Lesson.Status status);
}
