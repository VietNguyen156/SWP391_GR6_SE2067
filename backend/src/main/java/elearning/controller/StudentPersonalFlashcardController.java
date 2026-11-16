package elearning.controller;

import elearning.dto.FlashcardDto.FlashcardSetRequest;
import elearning.dto.FlashcardDto.FlashcardSetResponse;
import elearning.service.FlashcardService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/student/flashcards")
@PreAuthorize("hasRole('STUDENT')")
public class StudentPersonalFlashcardController {
    private final FlashcardService service;

    public StudentPersonalFlashcardController(FlashcardService s) {
        service = s;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FlashcardSetResponse create(Principal p, @Valid @RequestBody FlashcardSetRequest r) {
        return service.createPersonal(p.getName(), r);
    }

    @PutMapping("/{id}")
    public FlashcardSetResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody FlashcardSetRequest r) {
        return service.updatePersonal(p.getName(), id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        service.deletePersonal(p.getName(), id);
    }
}
