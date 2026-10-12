package elearning.controller;

import elearning.dto.GrammarDto.GrammarProgressResponse;
import elearning.dto.GrammarDto.GrammarTopicResponse;
import elearning.service.GrammarProgressService;
import elearning.service.GrammarService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/grammar")
@PreAuthorize("hasRole('STUDENT')")
public class StudentGrammarController {
    private final GrammarService grammar;
    private final GrammarProgressService progress;

    public StudentGrammarController(GrammarService g, GrammarProgressService p) {
        grammar = g;
        progress = p;
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
