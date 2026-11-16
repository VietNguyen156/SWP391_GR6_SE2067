package elearning.controller;

import elearning.dto.AssessmentDto.QuizRequest;
import elearning.dto.AssessmentDto.QuizResponse;
import elearning.dto.AssessmentDto.QuizSummaryResponse;
import elearning.service.QuizService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/quizzes")
@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
public class TeacherQuizController {
    private final QuizService service;

    public TeacherQuizController(QuizService s) {
        service = s;
    }

    @GetMapping
    public List<QuizSummaryResponse> list(Principal p) {
        return service.teacherList(p.getName());
    }

    @GetMapping("/{id}")
    public QuizResponse get(Principal p, @PathVariable Long id) {
        return service.teacherGet(p.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuizResponse create(Principal p, @Valid @RequestBody QuizRequest r) {
        return service.create(p.getName(), r);
    }

    @PutMapping("/{id}")
    public QuizResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody QuizRequest r) {
        return service.update(p.getName(), id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        service.delete(p.getName(), id);
    }
}
