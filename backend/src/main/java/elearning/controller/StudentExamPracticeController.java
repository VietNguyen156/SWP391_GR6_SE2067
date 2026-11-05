package elearning.controller;

import elearning.dto.ExamPracticeDto.PracticePlan;
import elearning.service.ExamPracticeService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/student/practice")
@PreAuthorize("hasRole('STUDENT')")
public class StudentExamPracticeController {
    private final ExamPracticeService practice;

    public StudentExamPracticeController(ExamPracticeService practice) {
        this.practice = practice;
    }

    @GetMapping("/plan")
    public PracticePlan plan(Principal principal) {
        return practice.plan(principal.getName());
    }
}
