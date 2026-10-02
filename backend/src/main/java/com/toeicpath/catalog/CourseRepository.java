package com.toeicpath.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStatusOrderByCreatedAtDesc(CourseStatus status);
}

