package elearning.repository;

import elearning.entity.CourseWeek;
import elearning.entity.Lesson;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findAllByCourseWeekIdOrderBySortOrderAsc(Long courseWeekId);

    List<Lesson> findAllByCourseWeekCourseIdOrderByCourseWeekWeekNumberAscSortOrderAsc(Long courseId);

    Optional<Lesson> findTopByCourseWeekIdOrderBySortOrderDesc(Long courseWeekId);

    Optional<Lesson> findByIdAndCreatedByTeacherId(Long id, Long teacherId);

    long countByCourseWeekCourseId(Long courseId);

    /** Có học viên đã mở một bài nào của tuần này. */
    @Query("select count(p) > 0 from LessonProgress p where p.lesson.courseWeek.id = :weekId")
    boolean weekHasLearners(Long weekId);

    /**
     * Gắn học liệu vào bài: nếu đổi sang bài khác (hoặc tạo mới) mà tuần của bài đã có học viên học
     * thì chặn, để không kéo lùi tiến độ của họ.
     */
    static Lesson addable(LessonRepository lessons, Lesson current, Lesson target) {
        boolean changed = current == null || !current.getId().equals(target.getId());
        if (changed && lessons.weekHasLearners(target.getCourseWeek().getId())) {
            throw new IllegalArgumentException(
                    "Tuần này đã có học viên học nên không thể thêm học liệu mới vào các bài của tuần.");
        }
        return target;
    }

    /** Số bài học viên đang thấy: bài hiển thị nằm trong tuần hiển thị. */
    long countByCourseWeekCourseIdAndCourseWeekStatusAndStatus(
            Long courseId, CourseWeek.Status weekStatus, Lesson.Status status);
}
