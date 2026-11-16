package elearning.repository;

import elearning.entity.CourseWeek;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface CourseWeekRepository extends JpaRepository<CourseWeek, Long> {
    List<CourseWeek> findAllByCourseIdOrderByWeekNumberAsc(Long courseId);

    long countByCourseId(Long courseId);

    long countByCourseIdAndStatus(Long courseId, CourseWeek.Status status);
}
