package elearning.controller;

import elearning.dto.AssessmentDto.QuestionRequest;
import elearning.dto.AssessmentDto.QuestionResponse;
import elearning.service.QuestionService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/questions")
@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
public class TeacherQuestionController {
    private final QuestionService service;

    public TeacherQuestionController(QuestionService s) {
        service = s;
    }

    @GetMapping
    public List<QuestionResponse> list(Principal p) {
        return service.list(p.getName());
    }

    @GetMapping("/{id}")
    public QuestionResponse get(Principal p, @PathVariable Long id) {
        return service.get(p.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionResponse create(Principal p, @Valid @RequestBody QuestionRequest r) {
        return service.create(p.getName(), r);
    }

    @PutMapping("/{id}")
    public QuestionResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody QuestionRequest r) {
        return service.update(p.getName(), id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        service.delete(p.getName(), id);
    }
}
