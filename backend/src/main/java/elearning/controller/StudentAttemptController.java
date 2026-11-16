package elearning.controller;

import elearning.dto.AssessmentDto.ResultDetailResponse;
import elearning.dto.AssessmentDto.SubmitAnswerRequest;
import elearning.dto.AssessmentDto.SubmitAnswerResponse;
import elearning.service.QuizAttemptService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/attempts")
@PreAuthorize("hasRole('STUDENT')")
public class StudentAttemptController {
    private final QuizAttemptService service;

    public StudentAttemptController(QuizAttemptService s) {
        service = s;
    }

    @PostMapping("/{id}/answers")
    public SubmitAnswerResponse answer(
            Principal p, @PathVariable Long id, @Valid @RequestBody SubmitAnswerRequest r) {
        return service.answer(p.getName(), id, r);
    }

    @PostMapping("/{id}/submit")
    public ResultDetailResponse submit(Principal p, @PathVariable Long id) {
        return service.finish(p.getName(), id);
    }
}
