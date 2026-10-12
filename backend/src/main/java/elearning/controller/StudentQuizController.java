package elearning.controller;

import elearning.dto.AssessmentDto.QuizSummaryResponse;
import elearning.dto.AssessmentDto.StartAttemptResponse;
import elearning.dto.AssessmentDto.StudentQuizResponse;
import elearning.service.QuizAttemptService;
import elearning.service.QuizService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@PreAuthorize("hasRole('STUDENT')")
public class StudentQuizController {
    private final QuizService quizzes;
    private final QuizAttemptService attempts;

    public StudentQuizController(QuizService q, QuizAttemptService a) {
        quizzes = q;
        attempts = a;
    }

    @GetMapping
    public List<QuizSummaryResponse> list(Principal p) {
        return quizzes.published(p.getName());
    }

    @GetMapping("/{id}")
    public StudentQuizResponse get(Principal p, @PathVariable Long id) {
        return quizzes.studentGet(p.getName(), id);
    }

    @PostMapping("/{id}/start")
    @ResponseStatus(HttpStatus.CREATED)
    public StartAttemptResponse start(Principal p, @PathVariable Long id) {
        return attempts.start(p.getName(), id);
    }
}
