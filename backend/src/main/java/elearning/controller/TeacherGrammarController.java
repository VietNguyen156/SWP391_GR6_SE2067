package elearning.controller;

import elearning.dto.GrammarDto.GrammarContentRequest;
import elearning.dto.GrammarDto.GrammarContentResponse;
import elearning.dto.GrammarDto.GrammarTopicRequest;
import elearning.dto.GrammarDto.GrammarTopicResponse;
import elearning.dto.GrammarDto.GrammarTopicSummaryResponse;
import elearning.service.GrammarService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/grammar")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherGrammarController {
    private final GrammarService service;

    public TeacherGrammarController(GrammarService s) {
        service = s;
    }

    @GetMapping("/topics")
    public List<GrammarTopicSummaryResponse> list(Principal p) {
        return service.teacherTopics(p.getName());
    }

    @GetMapping("/topics/{id}")
    public GrammarTopicResponse get(Principal p, @PathVariable Long id) {
        return service.teacherTopic(p.getName(), id);
    }

    @PostMapping("/topics")
    @ResponseStatus(HttpStatus.CREATED)
    public GrammarTopicResponse create(Principal p, @Valid @RequestBody GrammarTopicRequest r) {
        return service.createTopic(p.getName(), r);
    }

    @PutMapping("/topics/{id}")
    public GrammarTopicResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody GrammarTopicRequest r) {
        return service.updateTopic(p.getName(), id, r);
    }

    @DeleteMapping("/topics/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        service.deleteTopic(p.getName(), id);
    }

    @PostMapping("/{topicId}/contents")
    @ResponseStatus(HttpStatus.CREATED)
    public GrammarContentResponse addContent(
            Principal p, @PathVariable Long topicId, @Valid @RequestBody GrammarContentRequest r) {
        return service.addContent(p.getName(), topicId, r);
    }

    @PutMapping("/content/{id}")
    public GrammarContentResponse updateContent(
            Principal p, @PathVariable Long id, @Valid @RequestBody GrammarContentRequest r) {
        return service.updateContent(p.getName(), id, r);
    }

    @DeleteMapping("/content/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContent(Principal p, @PathVariable Long id) {
        service.deleteContent(p.getName(), id);
    }
}
