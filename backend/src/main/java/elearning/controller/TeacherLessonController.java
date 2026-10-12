package elearning.controller;

import elearning.dto.CourseDto.LessonRequest;
import elearning.dto.CourseDto.LessonResponse;
import elearning.dto.CourseDto.ReorderRequest;
import elearning.service.LessonService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherLessonController {
    private final LessonService service;

    public TeacherLessonController(LessonService service) {
        this.service = service;
    }

    @GetMapping("/lessons/{id}")
    public LessonResponse get(Principal principal, @PathVariable Long id) {
        return service.teacherLesson(principal.getName(), id);
    }

    @PostMapping("/lessons")
    @ResponseStatus(HttpStatus.CREATED)
    public LessonResponse create(Principal principal, @Valid @RequestBody LessonRequest request) {
        return service.create(principal.getName(), request);
    }

    @PutMapping("/lessons/{id}")
    public LessonResponse update(
            Principal principal, @PathVariable Long id, @Valid @RequestBody LessonRequest request) {
        return service.update(principal.getName(), id, request);
    }

    @DeleteMapping("/lessons/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal principal, @PathVariable Long id) {
        service.delete(principal.getName(), id);
    }

    /** Sắp xếp lại các bài trong tuần theo đúng thứ tự `ids` gửi lên. */
    @PutMapping("/weeks/{weekId}/lessons/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(
            Principal principal,
            @PathVariable Long weekId,
            @Valid @RequestBody ReorderRequest request) {
        service.reorder(principal.getName(), weekId, request.ids());
    }
}
