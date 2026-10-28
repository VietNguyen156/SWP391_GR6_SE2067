package elearning.repository;

import elearning.entity.Course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(Long teacherId);

    Optional<Course> findByIdAndCreatedByTeacherId(Long id, Long teacherId);

    List<Course> findAllByStatusOrderByPublishedAtDesc(Course.Status status);

    List<Course> findAllByOrderByUpdatedAtDesc();

    Optional<Course> findByIdAndStatus(Long id, Course.Status status);

    boolean existsBySlugIgnoreCase(String slug);
}
