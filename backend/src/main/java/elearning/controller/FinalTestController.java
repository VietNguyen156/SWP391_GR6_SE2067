package elearning.controller;

import elearning.service.FinalTestService;
import java.io.IOException;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class FinalTestController {
    private final FinalTestService tests;
    public FinalTestController(FinalTestService tests) { this.tests = tests; }

    @GetMapping("/teacher/courses/{courseId}/test/catalog")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public List<Map<String,Object>> catalog(@PathVariable long courseId, Principal user) { return tests.catalog(courseId, user.getName()); }

    @GetMapping("/teacher/courses/{courseId}/test")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> teacherGet(@PathVariable long courseId, Principal user) { return tests.teacherGet(courseId, user.getName()); }

    @PutMapping("/teacher/courses/{courseId}/test")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> save(@PathVariable long courseId, @RequestBody FinalTestService.DraftInput body, Principal user) {
        return tests.saveDraft(courseId, user.getName(), body);
    }

    @PostMapping("/teacher/courses/{courseId}/test/publish")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> publish(@PathVariable long courseId, Principal user) { return tests.publish(courseId, user.getName()); }

    @PostMapping("/teacher/courses/{courseId}/test/show")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> show(@PathVariable long courseId, Principal user) { return tests.show(courseId, user.getName()); }

    @PostMapping("/teacher/courses/{courseId}/test/hide")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> hide(@PathVariable long courseId, Principal user) { return tests.hide(courseId, user.getName()); }

    @DeleteMapping("/teacher/courses/{courseId}/test")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> delete(@PathVariable long courseId, Principal user) {
        tests.delete(courseId, user.getName());
        return Map.of("deleted", true);
    }

    @GetMapping("/teacher/courses/{courseId}/test/attempts")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public List<Map<String,Object>> attempts(@PathVariable long courseId, Principal user) { return tests.teacherAttempts(courseId, user.getName()); }

    @GetMapping("/teacher/courses/{courseId}/test/attempts/{attemptId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> teacherAttempt(@PathVariable long courseId, @PathVariable long attemptId, Principal user) {
        return tests.teacherAttempt(courseId, attemptId, user.getName());
    }

    @GetMapping("/teacher/test/attempts/{attemptId}/sections/{sectionId}/recording")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Resource> teacherRecording(@PathVariable long attemptId, @PathVariable long sectionId, Principal user) {
        Resource file = tests.recording(attemptId, sectionId, user.getName(), true);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(tests.recordingType(attemptId, sectionId))).body(file);
    }

    public record GradeRequest(BigDecimal score, String feedback) {}
    @PostMapping("/teacher/courses/{courseId}/test/attempts/{attemptId}/sections/{sectionId}/grade")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String,Object> grade(@PathVariable long courseId, @PathVariable long attemptId, @PathVariable long sectionId,
                                    @RequestBody GradeRequest body, Principal user) {
        return tests.grade(courseId, attemptId, sectionId, body.score(), body.feedback(), user.getName());
    }

    @GetMapping("/student/courses/{courseId}/test")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String,Object> studentInfo(@PathVariable long courseId, Principal user) { return tests.studentInfo(courseId, user.getName()); }

    @GetMapping("/student/tests/results")
    @PreAuthorize("hasRole('STUDENT')")
    public List<Map<String,Object>> studentResults(Principal user) { return tests.studentResults(user.getName()); }

    @PostMapping("/student/courses/{courseId}/test/start")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String,Object> start(@PathVariable long courseId, Principal user) { return tests.start(courseId, user.getName()); }

    @GetMapping("/student/test/attempts/{attemptId}")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String,Object> attempt(@PathVariable long attemptId, Principal user) { return tests.attempt(attemptId, user.getName()); }

    public record AnswerRequest(String questionKey, Long optionId) {}
    @PutMapping("/student/test/attempts/{attemptId}/sections/{sectionId}/answer")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String,Object> answer(@PathVariable long attemptId, @PathVariable long sectionId,
                                     @RequestBody AnswerRequest body, Principal user) {
        return tests.saveAnswer(attemptId, sectionId, body.questionKey(), body.optionId(), user.getName());
    }

    @PostMapping("/student/test/attempts/{attemptId}/sections/{sectionId}/recording")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String,Object> recording(@PathVariable long attemptId, @PathVariable long sectionId,
                                        @RequestParam("file") MultipartFile file, Principal user) throws IOException {
        return tests.saveRecording(attemptId, sectionId, file, user.getName());
    }

    @GetMapping("/student/test/attempts/{attemptId}/sections/{sectionId}/recording")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Resource> studentRecording(@PathVariable long attemptId, @PathVariable long sectionId, Principal user) {
        Resource file = tests.recording(attemptId, sectionId, user.getName(), false);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(tests.recordingType(attemptId, sectionId))).body(file);
    }

    @GetMapping("/student/test/attempts/{attemptId}/sections/{sectionId}/media")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Resource> sourceMedia(@PathVariable long attemptId, @PathVariable long sectionId,
            @RequestParam String kind, @RequestParam(defaultValue="0") int index, Principal user) {
        Resource file = tests.sourceMedia(attemptId, sectionId, kind, index, user.getName());
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(tests.sourceMediaType(attemptId, sectionId, kind, index, user.getName()))).body(file);
    }

    @PostMapping("/student/test/attempts/{attemptId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String,Object> submit(@PathVariable long attemptId, Principal user) { return tests.submit(attemptId, user.getName()); }
}
