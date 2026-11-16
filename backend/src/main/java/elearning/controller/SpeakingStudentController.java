package elearning.controller;

import elearning.dto.SpeakingDto.SpeakingResponse;
import elearning.dto.SpeakingDto.SpeakingSubmissionResponse;
import elearning.service.SpeakingStudentService;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

@RestController
@RequestMapping("/api/speaking")
@PreAuthorize("hasRole('STUDENT')")
public class SpeakingStudentController {
    private final SpeakingStudentService service;

    public SpeakingStudentController(SpeakingStudentService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public SpeakingResponse get(Principal principal, @PathVariable Long id) {
        return service.get(principal.getName(), id);
    }

    @GetMapping("/{id}/submission")
    public ResponseEntity<SpeakingSubmissionResponse> submission(
            Principal principal, @PathVariable Long id) {
        SpeakingSubmissionResponse submission = service.submission(principal.getName(), id);
        return submission == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(submission);
    }

    @GetMapping("/submissions/{submissionId}/audio")
    public ResponseEntity<Resource> audio(Principal principal, @PathVariable Long submissionId) {
        SpeakingStudentService.SubmissionAudio audio =
                service.submissionAudio(principal.getName(), submissionId);
        return ResponseEntity.ok().contentType(audio.contentType()).body(audio.resource());
    }

    @PostMapping(value = "/{id}/submit", consumes = "multipart/form-data")
    public SpeakingSubmissionResponse submit(
            Principal principal, @PathVariable Long id, @RequestParam("audio") MultipartFile audio)
            throws IOException {
        return service.submit(principal.getName(), id, audio);
    }
}
