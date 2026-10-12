package elearning.controller;

import elearning.dto.CourseDto.CourseResponse;
import elearning.dto.CourseDto.CourseSummaryResponse;
import elearning.service.CourseService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@PreAuthorize("hasRole('STUDENT')")
public class StudentCourseController {
    private final CourseService service;

    public StudentCourseController(CourseService service) {
        this.service = service;
    }

    @GetMapping
    public List<CourseSummaryResponse> list() {
        return service.publishedCourses();
    }

    @GetMapping("/{id}")
    public CourseResponse get(@PathVariable Long id) {
        return service.publishedCourse(id);
    }
}
