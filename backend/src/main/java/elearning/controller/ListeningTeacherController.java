package elearning.controller;

import elearning.dto.ListeningDto.ListeningRequest;
import elearning.dto.ListeningDto.ListeningResponse;
import elearning.service.ListeningService;
import elearning.service.MediaStorageService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/listening")
@PreAuthorize("hasRole('TEACHER')")
public class ListeningTeacherController {
    private final ListeningService s;
    private final MediaStorageService media;

    public ListeningTeacherController(ListeningService s, MediaStorageService media) {
        this.s = s;
        this.media = media;
    }

    @GetMapping
    public List<ListeningResponse> list(Principal p) {
        return s.list(p.getName());
    }

    @GetMapping("/{id}")
    public ListeningResponse get(Principal p, @PathVariable Long id) {
        return s.get(p.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListeningResponse create(Principal p, @Valid @RequestBody ListeningRequest r) {
        return s.save(p.getName(), null, r);
    }

    @PutMapping("/{id}")
    public ListeningResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody ListeningRequest r) {
        return s.save(p.getName(), id, r);
    }

    @PostMapping("/upload-audio")
    public java.util.Map<String, String> upload(
            Principal principal,
            @RequestParam("audio") org.springframework.web.multipart.MultipartFile audio)
            throws Exception {
        return java.util.Map.of(
                "url", media.store(audio, "listening/" + s.teacherId(principal.getName())));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        s.delete(p.getName(), id);
    }
}
