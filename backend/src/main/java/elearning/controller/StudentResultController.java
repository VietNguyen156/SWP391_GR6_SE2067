package elearning.controller;

import elearning.dto.AssessmentDto.ResultDetailResponse;
import elearning.dto.AssessmentDto.ResultSummaryResponse;
import elearning.service.QuizAttemptService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/student/results")
@PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
public class StudentResultController {
    private final QuizAttemptService service;

    public StudentResultController(QuizAttemptService s) {
        service = s;
    }

    @GetMapping
    public List<ResultSummaryResponse> list(Principal p) {
        return service.results(p.getName());
    }

    @GetMapping("/{id}")
    public ResultDetailResponse get(Principal p, @PathVariable Long id) {
        return service.result(p.getName(), id);
    }
}
