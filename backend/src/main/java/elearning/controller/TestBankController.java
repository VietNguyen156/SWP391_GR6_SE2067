package elearning.controller;

import elearning.dto.CourseDto.ReorderRequest;
import elearning.dto.GrammarDto.AttachmentResponse;
import elearning.dto.GrammarDto.UpdateAttachmentRequest;
import elearning.dto.TestBankDto.ListeningRequest;
import elearning.dto.TestBankDto.ListeningResponse;
import elearning.dto.TestBankDto.QuestionSetRequest;
import elearning.dto.TestBankDto.QuestionSetResponse;
import elearning.dto.TestBankDto.ReadingRequest;
import elearning.dto.TestBankDto.ReadingResponse;
import elearning.dto.TestBankDto.SpeakingRequest;
import elearning.dto.TestBankDto.SpeakingResponse;
import elearning.entity.TestBankStatus;
import elearning.service.TestBankService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Ngân hàng đề thi (Nghe / Đọc / Nói) của giáo viên, dùng riêng cho Test cuối khóa. */
@RestController
@RequestMapping("/api/teacher/test-bank")
@PreAuthorize("hasRole('TEACHER')")
public class TestBankController {
    private final TestBankService service;

    public TestBankController(TestBankService service) {
        this.service = service;
    }

    // ---- Bộ đề (nhiều câu hỏi) ----

    @GetMapping("/question-sets")
    public List<QuestionSetResponse> listQuestionSets(Principal p) {
        return service.listQuestionSets(p.getName());
    }

    @GetMapping("/question-sets/{id}")
    public QuestionSetResponse getQuestionSet(Principal p, @PathVariable Long id) {
        return service.getQuestionSet(p.getName(), id);
    }

    @PostMapping("/question-sets")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionSetResponse createQuestionSet(
            Principal p, @Valid @RequestBody QuestionSetRequest r) {
        return service.saveQuestionSet(p.getName(), null, r);
    }

    @PutMapping("/question-sets/{id}")
    public QuestionSetResponse updateQuestionSet(
            Principal p, @PathVariable Long id, @Valid @RequestBody QuestionSetRequest r) {
        return service.saveQuestionSet(p.getName(), id, r);
    }

    @PostMapping("/question-sets/{id}/publish")
    public QuestionSetResponse publishQuestionSet(Principal p, @PathVariable Long id) {
        return service.setQuestionSetStatus(p.getName(), id, TestBankStatus.ACTIVE);
    }

    @PostMapping("/question-sets/{id}/hide")
    public QuestionSetResponse hideQuestionSet(Principal p, @PathVariable Long id) {
        return service.setQuestionSetStatus(p.getName(), id, TestBankStatus.HIDDEN);
    }

    @DeleteMapping("/question-sets/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuestionSet(Principal p, @PathVariable Long id) {
        service.deleteQuestionSet(p.getName(), id);
    }

    // ---- Nghe ----

    @GetMapping("/listening")
    public List<ListeningResponse> listListening(Principal p) {
        return service.listListening(p.getName());
    }

    @GetMapping("/listening/{id}")
    public ListeningResponse getListening(Principal p, @PathVariable Long id) {
        return service.getListening(p.getName(), id);
    }

    @PostMapping("/listening")
    @ResponseStatus(HttpStatus.CREATED)
    public ListeningResponse createListening(Principal p, @Valid @RequestBody ListeningRequest r) {
        return service.saveListening(p.getName(), null, r);
    }

    @PutMapping("/listening/{id}")
    public ListeningResponse updateListening(
            Principal p, @PathVariable Long id, @Valid @RequestBody ListeningRequest r) {
        return service.saveListening(p.getName(), id, r);
    }

    @PostMapping("/listening/{id}/publish")
    public ListeningResponse publishListening(Principal p, @PathVariable Long id) {
        return service.setListeningStatus(p.getName(), id, TestBankStatus.ACTIVE);
    }

    @PostMapping("/listening/{id}/hide")
    public ListeningResponse hideListening(Principal p, @PathVariable Long id) {
        return service.setListeningStatus(p.getName(), id, TestBankStatus.HIDDEN);
    }

    @DeleteMapping("/listening/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteListening(Principal p, @PathVariable Long id) {
        service.deleteListening(p.getName(), id);
    }

    @PostMapping("/listening/upload-audio")
    public Map<String, String> uploadAudio(Principal p, @RequestParam("audio") MultipartFile audio)
            throws IOException {
        return Map.of("url", service.uploadAudio(p.getName(), audio));
    }

    // ---- Đọc ----

    @GetMapping("/reading")
    public List<ReadingResponse> listReading(Principal p) {
        return service.listReading(p.getName());
    }

    @GetMapping("/reading/{id}")
    public ReadingResponse getReading(Principal p, @PathVariable Long id) {
        return service.getReading(p.getName(), id);
    }

    @PostMapping("/reading")
    @ResponseStatus(HttpStatus.CREATED)
    public ReadingResponse createReading(Principal p, @Valid @RequestBody ReadingRequest r) {
        return service.saveReading(p.getName(), null, r);
    }

    @PutMapping("/reading/{id}")
    public ReadingResponse updateReading(
            Principal p, @PathVariable Long id, @Valid @RequestBody ReadingRequest r) {
        return service.saveReading(p.getName(), id, r);
    }

    @PostMapping("/reading/{id}/publish")
    public ReadingResponse publishReading(Principal p, @PathVariable Long id) {
        return service.setReadingStatus(p.getName(), id, TestBankStatus.ACTIVE);
    }

    @PostMapping("/reading/{id}/hide")
    public ReadingResponse hideReading(Principal p, @PathVariable Long id) {
        return service.setReadingStatus(p.getName(), id, TestBankStatus.HIDDEN);
    }

    @DeleteMapping("/reading/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReading(Principal p, @PathVariable Long id) {
        service.deleteReading(p.getName(), id);
    }

    @PostMapping(path = "/reading/{id}/attachments/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse addFile(
            Principal p,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title)
            throws IOException {
        return service.addFile(p.getName(), id, file, title);
    }

    @PutMapping("/reading/attachments/{attId}")
    public AttachmentResponse renameAttachment(
            Principal p, @PathVariable Long attId, @Valid @RequestBody UpdateAttachmentRequest r) {
        return service.renameAttachment(p.getName(), attId, r.title());
    }

    @PutMapping("/reading/{id}/attachments/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderAttachments(
            Principal p, @PathVariable Long id, @Valid @RequestBody ReorderRequest r) {
        service.reorderAttachments(p.getName(), id, r.ids());
    }

    @DeleteMapping("/reading/attachments/{attId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(Principal p, @PathVariable Long attId) {
        service.deleteAttachment(p.getName(), attId);
    }

    @GetMapping("/reading/attachments/{attId}/file")
    public ResponseEntity<Resource> attachmentFile(Principal p, @PathVariable Long attId) {
        TestBankService.AttachmentFile file = service.attachmentFile(p.getName(), attId);
        String mime = file.mimeType() == null ? "application/octet-stream" : file.mimeType();
        boolean inline = mime.equals("application/pdf") || mime.startsWith("image/");
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

    // ---- Nói ----

    @GetMapping("/speaking")
    public List<SpeakingResponse> listSpeaking(Principal p) {
        return service.listSpeaking(p.getName());
    }

    @GetMapping("/speaking/{id}")
    public SpeakingResponse getSpeaking(Principal p, @PathVariable Long id) {
        return service.getSpeaking(p.getName(), id);
    }

    @PostMapping("/speaking")
    @ResponseStatus(HttpStatus.CREATED)
    public SpeakingResponse createSpeaking(Principal p, @Valid @RequestBody SpeakingRequest r) {
        return service.saveSpeaking(p.getName(), null, r);
    }

    @PutMapping("/speaking/{id}")
    public SpeakingResponse updateSpeaking(
            Principal p, @PathVariable Long id, @Valid @RequestBody SpeakingRequest r) {
        return service.saveSpeaking(p.getName(), id, r);
    }

    @PostMapping("/speaking/{id}/publish")
    public SpeakingResponse publishSpeaking(Principal p, @PathVariable Long id) {
        return service.setSpeakingStatus(p.getName(), id, TestBankStatus.ACTIVE);
    }

    @PostMapping("/speaking/{id}/hide")
    public SpeakingResponse hideSpeaking(Principal p, @PathVariable Long id) {
        return service.setSpeakingStatus(p.getName(), id, TestBankStatus.HIDDEN);
    }

    @DeleteMapping("/speaking/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSpeaking(Principal p, @PathVariable Long id) {
        service.deleteSpeaking(p.getName(), id);
    }
}
