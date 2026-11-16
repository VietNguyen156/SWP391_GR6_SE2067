package elearning.controller;

import elearning.dto.CourseDto.CourseResponse;
import elearning.dto.CourseDto.CourseSummaryResponse;
import elearning.dto.CourseDto.CreateCourseRequest;
import elearning.dto.CourseDto.UpdateCourseRequest;
import elearning.service.CourseService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/courses")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherCourseController {
    private final CourseService service;

    public TeacherCourseController(CourseService service) {
        this.service = service;
    }

    @GetMapping
    public List<CourseSummaryResponse> list(Principal principal) {
        return service.teacherCourses(principal.getName());
    }

    @GetMapping("/{id}")
    public CourseResponse get(Principal principal, @PathVariable Long id) {
        return service.teacherCourse(principal.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(
            Principal principal, @Valid @RequestBody CreateCourseRequest request) {
        return service.create(principal.getName(), request);
    }

    @PutMapping("/{id}")
    public CourseResponse update(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseRequest request) {
        return service.update(principal.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal principal, @PathVariable Long id) {
        service.delete(principal.getName(), id);
    }
}
