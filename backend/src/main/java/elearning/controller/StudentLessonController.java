package elearning.controller;

import elearning.dto.CourseDto.LessonCompletionResponse;
import elearning.dto.CourseDto.LessonResponse;
import elearning.service.LessonService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/lessons")
@PreAuthorize("hasRole('STUDENT')")
public class StudentLessonController {
    private final LessonService service;

    public StudentLessonController(LessonService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public LessonResponse get(Principal principal, @PathVariable Long id) {
        return service.studentLesson(principal.getName(), id);
    }

    @PostMapping("/{id}/start")
    public LessonCompletionResponse start(Principal principal, @PathVariable Long id) {
        return service.start(principal.getName(), id);
    }

    @PostMapping("/{id}/complete")
    public LessonCompletionResponse complete(Principal principal, @PathVariable Long id) {
        return service.complete(principal.getName(), id);
    }
}
