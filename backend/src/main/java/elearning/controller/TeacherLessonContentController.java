package elearning.controller;

import elearning.dto.CourseDto.LessonContentRequest;
import elearning.dto.CourseDto.LessonContentResponse;
import elearning.dto.CourseDto.ReorderRequest;
import elearning.service.LessonContentService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherLessonContentController {
    private final LessonContentService service;

    public TeacherLessonContentController(LessonContentService service) {
        this.service = service;
    }

    @GetMapping("/lessons/{lessonId}/contents")
    public List<LessonContentResponse> list(Principal principal, @PathVariable Long lessonId) {
        return service.list(principal.getName(), lessonId);
    }

    @PostMapping("/lessons/{lessonId}/contents")
    @ResponseStatus(HttpStatus.CREATED)
    public LessonContentResponse create(
            Principal principal,
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonContentRequest request) {
        return service.create(principal.getName(), lessonId, request);
    }

    /** Sắp xếp lại bài giảng trong bài theo đúng thứ tự `ids` gửi lên. */
    @PutMapping("/lessons/{lessonId}/contents/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(
            Principal principal,
            @PathVariable Long lessonId,
            @Valid @RequestBody ReorderRequest request) {
        service.reorder(principal.getName(), lessonId, request.ids());
    }

    @PutMapping("/lesson-contents/{id}")
    public LessonContentResponse update(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody LessonContentRequest request) {
        return service.update(principal.getName(), id, request);
    }

    @DeleteMapping("/lesson-contents/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal principal, @PathVariable Long id) {
        service.delete(principal.getName(), id);
    }
}
