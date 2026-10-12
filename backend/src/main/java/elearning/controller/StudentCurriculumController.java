package elearning.controller;

import elearning.dto.CurriculumDto.WeekSummary;
import elearning.service.CurriculumService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@PreAuthorize("hasAnyRole('STUDENT','ADMIN','TEACHER')")
public class StudentCurriculumController {
    private final CurriculumService service;

    public StudentCurriculumController(CurriculumService service) {
        this.service = service;
    }

    @GetMapping("/{courseId}/curriculum")
    public List<WeekSummary> list(Principal principal, @PathVariable Long courseId) {
        return service.studentCurriculum(principal.getName(), courseId);
    }
}
