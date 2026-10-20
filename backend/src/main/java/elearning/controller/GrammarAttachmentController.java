package elearning.controller;

import elearning.dto.CourseDto.ReorderRequest;
import elearning.dto.GrammarDto.AttachmentResponse;
import elearning.dto.GrammarDto.LinkAttachmentRequest;
import elearning.dto.GrammarDto.UpdateAttachmentRequest;
import elearning.service.GrammarAttachmentService;
import elearning.service.GrammarService;

import jakarta.validation.Valid;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Principal;

/** Tệp / link đính kèm của từng phần giải thích Ngữ pháp ({id} = id phần giải thích): quản lý (giáo viên chủ sở hữu, admin) và xem / tải. */
@RestController
@RequestMapping("/api")
public class GrammarAttachmentController {
    private final GrammarAttachmentService attachments;
    private final GrammarService grammar;

    public GrammarAttachmentController(GrammarAttachmentService attachments, GrammarService grammar) {
        this.attachments = attachments;
        this.grammar = grammar;
    }

    @PostMapping(path = "/teacher/grammar/content/{id}/attachments/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse addFile(
            Principal p,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title)
            throws IOException {
        return attachments.addFile(p.getName(), id, file, title);
    }

    @PostMapping("/teacher/grammar/content/{id}/attachments/link")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse addLink(
            Principal p, @PathVariable Long id, @Valid @RequestBody LinkAttachmentRequest r) {
        return attachments.addLink(p.getName(), id, r.title(), r.url());
    }

    @PutMapping("/teacher/grammar/attachments/{attId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public AttachmentResponse update(
            Principal p, @PathVariable Long attId, @Valid @RequestBody UpdateAttachmentRequest r) {
        return attachments.update(p.getName(), attId, r.title(), r.url());
    }

    @PutMapping("/teacher/grammar/content/{id}/attachments/reorder")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(Principal p, @PathVariable Long id, @Valid @RequestBody ReorderRequest r) {
        attachments.reorder(p.getName(), id, r.ids());
    }

    @DeleteMapping("/teacher/grammar/attachments/{attId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long attId) {
        attachments.delete(p.getName(), attId);
    }

    /** pdf, ảnh, audio, video mở trực tiếp (inline); Word / PowerPoint / Excel tải về (attachment). */
    @GetMapping("/grammar/attachments/{attId}/file")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<Resource> file(Principal p, @PathVariable Long attId) {
        GrammarService.AttachmentFile file = grammar.attachmentFile(p.getName(), attId);
        String mime = file.mimeType() == null ? "application/octet-stream" : file.mimeType();
        boolean inline =
                mime.equals("application/pdf")
                        || mime.startsWith("image/")
                        || mime.startsWith("audio/")
                        || mime.startsWith("video/");
        ContentDisposition disposition =
                (inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                        .filename(file.fileName() == null ? "tai-lieu" : file.fileName(), StandardCharsets.UTF_8)
                        .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header("Cache-Control", "private, no-store")
                .body(file.resource());
    }
}
