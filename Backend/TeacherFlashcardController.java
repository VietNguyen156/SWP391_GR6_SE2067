package elearning.controller;

import elearning.dto.FlashcardDto.FlashcardSetRequest;
import elearning.dto.FlashcardDto.FlashcardSetResponse;
import elearning.dto.FlashcardDto.FlashcardSetSummaryResponse;
import elearning.service.FlashcardService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/flashcards")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherFlashcardController {
    private final FlashcardService service;

    public TeacherFlashcardController(FlashcardService s) {
        service = s;
    }

    @GetMapping
    public List<FlashcardSetSummaryResponse> list(Principal p) {
        return service.teacherSets(p.getName());
    }

    @GetMapping("/{id}")
    public FlashcardSetResponse get(Principal p, @PathVariable Long id) {
        return service.teacherSet(p.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FlashcardSetResponse create(Principal p, @Valid @RequestBody FlashcardSetRequest r) {
        return service.createTeacher(p.getName(), r);
    }

    @PutMapping("/{id}")
    public FlashcardSetResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody FlashcardSetRequest r) {
        return service.updateTeacher(p.getName(), id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        service.deleteTeacher(p.getName(), id);
    }
}
