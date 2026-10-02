package com.toeicpath.catalog;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PublicCourseService {

    private final CourseRepository courseRepository;

    public PublicCourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseSummary> getPublishedCourses() {
        return courseRepository.findByStatusOrderByCreatedAtDesc(CourseStatus.PUBLISHED)
                .stream()
                .map(course -> new CourseSummary(
                        course.getId(),
                        course.getCode(),
                        course.getTitle(),
                        course.getDescription(),
                        course.getLevel(),
                        course.getPriceVnd()
                ))
                .toList();
    }
}

