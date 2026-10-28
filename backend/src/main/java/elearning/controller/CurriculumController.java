package elearning.controller;

import elearning.dto.CurriculumDto.WeekRequest;
import elearning.dto.CurriculumDto.WeekSummary;
import elearning.service.CurriculumService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/curriculum")
@PreAuthorize("hasRole('TEACHER')")
public class CurriculumController {
    private final CurriculumService s;

    public CurriculumController(CurriculumService s) {
        this.s = s;
    }

    @GetMapping("/courses/{courseId}")
    public List<WeekSummary> list(Principal p, @PathVariable Long courseId) {
        return s.teacherCurriculum(p.getName(), courseId);
    }

    @PostMapping("/courses/{courseId}/weeks")
    @ResponseStatus(HttpStatus.CREATED)
    public WeekSummary create(
            Principal p, @PathVariable Long courseId, @Valid @RequestBody WeekRequest r) {
        return s.create(p.getName(), courseId, r);
    }

    @PutMapping("/weeks/{id}")
    public WeekSummary update(
            Principal p, @PathVariable Long id, @Valid @RequestBody WeekRequest r) {
        return s.update(p.getName(), id, r);
    }

    @DeleteMapping("/weeks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        s.delete(p.getName(), id);
    }
}
