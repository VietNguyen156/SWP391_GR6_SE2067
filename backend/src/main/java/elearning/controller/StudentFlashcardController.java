package elearning.controller;

import elearning.dto.FlashcardDto.FlashcardProgressRequest;
import elearning.dto.FlashcardDto.FlashcardResponse;
import elearning.dto.FlashcardDto.FlashcardSetResponse;
import elearning.dto.FlashcardDto.FlashcardSetSummaryResponse;
import elearning.service.FlashcardService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/flashcards")
@PreAuthorize("hasRole('STUDENT')")
public class StudentFlashcardController {
    private final FlashcardService service;

    public StudentFlashcardController(FlashcardService s) {
        service = s;
    }

    @GetMapping
    public List<FlashcardSetSummaryResponse> list(Principal p) {
        return service.studentSets(p.getName());
    }

    @GetMapping("/{id}")
    public FlashcardSetResponse get(Principal p, @PathVariable Long id) {
        return service.studentSet(p.getName(), id);
    }

    @PutMapping("/{cardId}/progress")
    public FlashcardResponse progress(
            Principal p,
            @PathVariable Long cardId,
            @Valid @RequestBody FlashcardProgressRequest r) {
        return service.updateProgress(p.getName(), cardId, r);
    }
}
