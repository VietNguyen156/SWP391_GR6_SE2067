package elearning.controller;

import elearning.dto.ReadingDto.ReadingResponse;
import elearning.dto.ReadingDto.ReadingResultResponse;
import elearning.dto.ReadingDto.ReadingSubmitRequest;
import elearning.entity.ReadingActivity;
import elearning.entity.ReadingAnswer;
import elearning.entity.ReadingAttempt;
import elearning.entity.ReadingOption;
import elearning.entity.ReadingQuestion;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.ReadingAnswerRepository;
import elearning.repository.ReadingAttemptRepository;
import elearning.repository.ReadingQuestionRepository;
import elearning.repository.UserRepository;
import elearning.service.LessonService;
import elearning.service.ReadingService;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Transactional
@RestController
@RequestMapping("/api/reading")
public class ReadingStudentController {
    private final ReadingService reading;
    private final ReadingQuestionRepository qs;
    private final ReadingAttemptRepository attempts;
    private final ReadingAnswerRepository answers;
    private final UserRepository users;
    private final LessonService lessonService;

    public ReadingStudentController(
            ReadingService reading,
            ReadingQuestionRepository qs,
            ReadingAttemptRepository attempts,
            ReadingAnswerRepository answers,
            UserRepository users,
            LessonService lessonService) {
        this.reading = reading;
        this.qs = qs;
        this.attempts = attempts;
        this.answers = answers;
        this.users = users;
        this.lessonService = lessonService;
    }

    /** Không kèm đáp án đúng, giải thích hay căn cứ — chỉ có trong kết quả sau khi nộp. */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ReadingResponse get(Principal p, @PathVariable Long id) {
        ReadingActivity a = reading.visible(id);
        reading.requireStudentAccess(student(p.getName()), a);
        return reading.response(a, false);
    }

    @GetMapping("/{id}/result")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ReadingResultResponse> latestResult(Principal p, @PathVariable Long id) {
        User student = student(p.getName());
        reading.requireStudentAccess(student, reading.visible(id));
        return attempts.findTopByActivityIdAndStudentIdOrderBySubmittedAtDesc(id, student.getId())
                .map(this::result)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ReadingResultResponse submit(
            Principal p, @PathVariable Long id, @RequestBody ReadingSubmitRequest r) {
        User st = student(p.getName());
        ReadingActivity a = reading.visible(id);
        reading.requireStudentAccess(st, a);
        // Mỗi học viên một lượt: nộp lại (bấm hai lần, tải lại trang) trả về kết quả đã lưu.
        var existing = attempts.findTopByActivityIdAndStudentIdOrderBySubmittedAtDesc(id, st.getId());
        if (existing.isPresent()) return result(existing.get());

        ReadingAttempt at = new ReadingAttempt();
        at.setActivity(a);
        at.setStudent(st);
        attempts.save(at);
        int total = 0, correct = 0;
        for (ReadingQuestion q : qs.findAllByActivityIdOrderBySortOrderAsc(id)) {
            total++;
            Long oid = r.answers() == null ? null : r.answers().get(q.getId());
            ReadingOption opt =
                    q.getOptions().stream()
                            .filter(o -> Objects.equals(o.getId(), oid))
                            .findFirst()
                            .orElse(null);
            ReadingAnswer an = new ReadingAnswer();
            an.setAttempt(at);
            an.setQuestion(q);
            an.setOption(opt);
            an.setCorrect(opt != null && opt.isCorrect());
            answers.save(an);
            if (an.isCorrect()) correct++;
        }
        at.setScore(
                total == 0
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(correct * 100.0 / total).setScale(2, RoundingMode.HALF_UP));
        attempts.save(at);
        lessonService.autoComplete(st, a.getLesson());
        return result(at);
    }

    /** pdf, ảnh mở trực tiếp (inline); Word tải về. */
    @GetMapping("/attachments/{attId}/file")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> file(Principal p, @PathVariable Long attId) {
        ReadingService.AttachmentFile file = reading.attachmentFile(p.getName(), attId);
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

    private ReadingResultResponse result(ReadingAttempt attempt) {
        List<ReadingAnswer> rows = answers.findAllByAttemptId(attempt.getId());
        int correct = (int) rows.stream().filter(ReadingAnswer::isCorrect).count();
        Map<Long, Long> selected = new LinkedHashMap<>();
        rows.stream()
                .sorted(Comparator.comparing(row -> row.getQuestion().getSortOrder()))
                .forEach(
                        row ->
                                selected.put(
                                        row.getQuestion().getId(),
                                        row.getOption() == null ? null : row.getOption().getId()));
        Map<Long, Long> key = new LinkedHashMap<>();
        Map<Long, String> explanations = new LinkedHashMap<>();
        Map<Long, String> evidence = new LinkedHashMap<>();
        for (ReadingQuestion q :
                qs.findAllByActivityIdOrderBySortOrderAsc(attempt.getActivity().getId())) {
            q.getOptions().stream()
                    .filter(ReadingOption::isCorrect)
                    .findFirst()
                    .ifPresent(o -> key.put(q.getId(), o.getId()));
            if (q.getExplanation() != null) explanations.put(q.getId(), q.getExplanation());
            if (q.getEvidence() != null) evidence.put(q.getId(), q.getEvidence());
        }
        return new ReadingResultResponse(
                attempt.getId(),
                attempt.getScore(),
                correct,
                rows.size(),
                attempt.getSubmittedAt(),
                selected,
                key,
                explanations,
                evidence);
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(
                        () -> new IllegalArgumentException("Không tìm thấy học viên đang hoạt động"));
    }
}
