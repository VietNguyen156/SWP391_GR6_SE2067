package elearning.controller;

import elearning.dto.GrammarDto.GrammarProgressResponse;
import elearning.dto.GrammarDto.GrammarTopicResponse;
import elearning.dto.GrammarExerciseDto.AttemptResult;
import elearning.dto.GrammarExerciseDto.AttemptSummary;
import elearning.dto.GrammarExerciseDto.StudentExercisesResponse;
import elearning.dto.GrammarExerciseDto.SubmitRequest;
import elearning.service.GrammarExerciseService;
import elearning.service.GrammarProgressService;
import elearning.service.GrammarService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/grammar")
@PreAuthorize("hasRole('STUDENT')")
public class StudentGrammarController {
    private final GrammarService grammar;
    private final GrammarProgressService progress;
    private final GrammarExerciseService exercises;

    public StudentGrammarController(
            GrammarService g, GrammarProgressService p, GrammarExerciseService exercises) {
        grammar = g;
        progress = p;
        this.exercises = exercises;
    }

    @GetMapping("/topics/{id}/exercises")
    public StudentExercisesResponse exercises(Principal p, @PathVariable Long id) {
        return exercises.studentExercises(p.getName(), id);
    }

    @PostMapping("/topics/{id}/exercises/submit")
    public AttemptResult submitExercises(
            Principal p, @PathVariable Long id, @RequestBody SubmitRequest request) {
        return exercises.submit(p.getName(), id, request);
    }

    @GetMapping("/topics/{id}/exercises/history")
    public List<AttemptSummary> exerciseHistory(Principal p, @PathVariable Long id) {
        return exercises.history(p.getName(), id);
    }

    @GetMapping("/topics/{id}")
    public GrammarTopicResponse get(Principal p, @PathVariable Long id) {
        return grammar.studentTopic(p.getName(), id);
    }

    @PostMapping("/{id}/complete")
    public GrammarProgressResponse complete(Principal p, @PathVariable Long id) {
        return progress.complete(p.getName(), id);
    }
}
