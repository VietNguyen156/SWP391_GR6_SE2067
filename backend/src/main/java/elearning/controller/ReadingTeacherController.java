package elearning.controller;

import elearning.dto.CourseDto.ReorderRequest;
import elearning.dto.GrammarDto.AttachmentResponse;
import elearning.dto.GrammarDto.UpdateAttachmentRequest;
import elearning.dto.ReadingDto.ReadingRequest;
import elearning.dto.ReadingDto.ReadingResponse;
import elearning.service.ReadingService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/reading")
@PreAuthorize("hasRole('TEACHER')")
public class ReadingTeacherController {
    private final ReadingService s;

    public ReadingTeacherController(ReadingService s) {
        this.s = s;
    }

    @GetMapping
    public List<ReadingResponse> list(Principal p) {
        return s.list(p.getName());
    }

    @GetMapping("/{id}")
    public ReadingResponse get(Principal p, @PathVariable Long id) {
        return s.get(p.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReadingResponse create(Principal p, @Valid @RequestBody ReadingRequest r) {
        return s.save(p.getName(), null, r);
    }

    @PutMapping("/{id}")
    public ReadingResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody ReadingRequest r) {
        return s.save(p.getName(), id, r);
    }

    @PostMapping("/{id}/publish")
    public ReadingResponse publish(Principal p, @PathVariable Long id) {
        return s.publish(p.getName(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        s.delete(p.getName(), id);
    }

    @PostMapping(path = "/{id}/attachments/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse addFile(
            Principal p,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title)
            throws IOException {
        return s.addFile(p.getName(), id, file, title);
    }

    @PutMapping("/attachments/{attId}")
    public AttachmentResponse rename(
            Principal p, @PathVariable Long attId, @Valid @RequestBody UpdateAttachmentRequest r) {
        return s.renameAttachment(p.getName(), attId, r.title());
    }

    @PutMapping("/{id}/attachments/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(Principal p, @PathVariable Long id, @Valid @RequestBody ReorderRequest r) {
        s.reorderAttachments(p.getName(), id, r.ids());
    }

    @DeleteMapping("/attachments/{attId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(Principal p, @PathVariable Long attId) {
        s.deleteAttachment(p.getName(), attId);
    }
}
