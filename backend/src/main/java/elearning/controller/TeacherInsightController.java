package elearning.controller;

import elearning.dto.InsightDto.ListeningGrammarInsights;
import elearning.service.TeacherInsightService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/teacher/insights")
@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
public class TeacherInsightController {
    private final TeacherInsightService service;

    public TeacherInsightController(TeacherInsightService service) {
        this.service = service;
    }

    @GetMapping("/listening-grammar")
    public ListeningGrammarInsights listeningGrammar(Principal p) {
        return service.insights(p.getName());
    }
}
