package elearning.controller;

import elearning.dto.ProgressDto.LearningHistoryResponse;
import elearning.dto.ProgressDto.LearningStatisticsResponse;
import elearning.dto.ProgressDto.LessonProgressSummary;
import elearning.dto.ProgressDto.OverallProgressResponse;
import elearning.service.ProgressService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentProgressController {
    private final ProgressService service;

    public StudentProgressController(ProgressService s) {
        service = s;
    }

    @GetMapping("/progress")
    public OverallProgressResponse progress(Principal p) {
        return service.overall(p.getName());
    }

    @GetMapping("/courses/{id}/progress")
    public LessonProgressSummary course(Principal p, @PathVariable Long id) {
        return service.courseProgress(p.getName(), id);
    }

    @GetMapping("/history")
    public List<LearningHistoryResponse> history(Principal p) {
        return service.history(p.getName());
    }

    @GetMapping("/statistics")
    public LearningStatisticsResponse statistics(Principal p) {
        return service.statistics(p.getName());
    }
}
