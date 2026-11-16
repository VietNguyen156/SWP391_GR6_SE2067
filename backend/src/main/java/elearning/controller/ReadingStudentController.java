package elearning.controller;

import elearning.dto.ReadingDto.ReadingResponse;
import elearning.dto.ReadingDto.ReadingResultResponse;
import elearning.dto.ReadingDto.ReadingSubmitRequest;
import elearning.dto.ReadingDto.PracticeAttemptSummary;
import elearning.dto.ReadingDto.SkillAnalysis;
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
        return attempts.findFirstByActivityIdAndStudentIdAndAssessmentSlot(
                        id, student.getId(), 1)
                .map(this::result)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}/practice/{skillType}")
    @PreAuthorize("hasRole('STUDENT')")
    public ReadingResponse practice(
            Principal p,
            @PathVariable Long id,
            @PathVariable ReadingQuestion.SkillType skillType) {
        User student = student(p.getName());
        ReadingActivity activity = reading.visible(id);
        reading.requireStudentAccess(student, activity);
        ReadingResponse response = reading.response(activity, false);
        List<ReadingResponse.Question> selected =
                response.questions().stream()
                        .filter(question -> question.skillType() == skillType)
                        .toList();
        if (selected.isEmpty()) {
            throw new IllegalArgumentException(
                    "Bài đọc chưa có câu hỏi thuộc kỹ năng " + skillType.name());
        }
        return new ReadingResponse(
                response.id(),
                response.courseWeekId(),
                response.lessonId(),
                response.title(),
                response.description(),
                response.instruction(),
                response.passage(),
                response.passageFormat(),
                response.toeicPart(),
                response.passageType(),
                response.status(),
                selected,
                response.attachments(),
                false,
                0);
    }

    @GetMapping("/{id}/practice/{skillType}/result")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ReadingResultResponse> latestPracticeResult(
            Principal p,
            @PathVariable Long id,
            @PathVariable ReadingQuestion.SkillType skillType) {
        User student = student(p.getName());
        reading.requireStudentAccess(student, reading.visible(id));
        return attempts
                .findFirstByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDesc(
                        id, student.getId(), ReadingAttempt.Type.TARGETED_PRACTICE, skillType)
                .map(this::result)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}/practice/{skillType}/history")
    @PreAuthorize("hasRole('STUDENT')")
    public List<PracticeAttemptSummary> practiceHistory(
            Principal p,
            @PathVariable Long id,
            @PathVariable ReadingQuestion.SkillType skillType) {
        User student = student(p.getName());
        reading.requireStudentAccess(student, reading.visible(id));
        return attempts
                .findAllByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDesc(
                        id, student.getId(), ReadingAttempt.Type.TARGETED_PRACTICE, skillType)
                .stream()
                .map(
                        attempt -> {
                            ReadingResultResponse result = result(attempt);
                            return new PracticeAttemptSummary(
                                    result.attemptId(),
                                    result.skillType(),
                                    result.score(),
                                    result.correct(),
                                    result.total(),
                                    result.submittedAt());
                        })
                .toList();
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ReadingResultResponse submit(
            Principal p, @PathVariable Long id, @RequestBody ReadingSubmitRequest r) {
        User st = student(p.getName());
        ReadingActivity a = reading.visible(id);
        reading.requireStudentAccess(st, a);
        // Lượt đánh giá chính thức là duy nhất; request lặp lại trả kết quả đã lưu.
        var existing =
                attempts.findFirstByActivityIdAndStudentIdAndAssessmentSlot(
                        id, st.getId(), 1);
        if (existing.isPresent()) return result(existing.get());

        ReadingAttempt at =
                saveAttempt(
                        a,
                        st,
                        qs.findAllByActivityIdOrderBySortOrderAsc(id),
                        r,
                        ReadingAttempt.Type.ASSESSMENT,
                        null,
                        1);
        lessonService.autoComplete(st, a.getLesson());
        return result(at);
    }

    @PostMapping("/{id}/practice/{skillType}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ReadingResultResponse submitPractice(
            Principal p,
            @PathVariable Long id,
            @PathVariable ReadingQuestion.SkillType skillType,
            @RequestBody ReadingSubmitRequest request) {
        User student = student(p.getName());
        ReadingActivity activity = reading.visible(id);
        reading.requireStudentAccess(student, activity);
        List<ReadingQuestion> questions =
                qs.findAllByActivityIdOrderBySortOrderAsc(id).stream()
                        .filter(question -> question.getSkillType() == skillType)
                        .toList();
        if (questions.isEmpty()) {
            throw new IllegalArgumentException(
                    "Bài đọc chưa có câu hỏi thuộc kỹ năng " + skillType.name());
        }
        return result(
                saveAttempt(
                        activity,
                        student,
                        questions,
                        request,
                        ReadingAttempt.Type.TARGETED_PRACTICE,
                        skillType,
                        null));
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
        Map<String, int[]> skillCounts = new LinkedHashMap<>();
        for (ReadingAnswer row : rows) {
            ReadingQuestion q = row.getQuestion();
            String skill =
                    (q.getSkillType() == null ? ReadingQuestion.SkillType.DETAIL : q.getSkillType())
                            .name();
            int[] counts = skillCounts.computeIfAbsent(skill, ignored -> new int[2]);
            counts[1]++;
            if (row.isCorrect()) counts[0]++;
            q.getOptions().stream()
                    .filter(ReadingOption::isCorrect)
                    .findFirst()
                    .ifPresent(o -> key.put(q.getId(), o.getId()));
            if (q.getExplanation() != null) explanations.put(q.getId(), q.getExplanation());
            if (q.getEvidence() != null) evidence.put(q.getId(), q.getEvidence());
        }
        Map<String, SkillAnalysis> analysis = new LinkedHashMap<>();
        skillCounts.forEach(
                (skill, counts) ->
                        analysis.put(
                                skill,
                                new SkillAnalysis(
                                        counts[0],
                                        counts[1],
                                        BigDecimal.valueOf(counts[0] * 100.0 / counts[1])
                                                .setScale(2, RoundingMode.HALF_UP))));
        return new ReadingResultResponse(
                attempt.getId(),
                attempt.getScore(),
                correct,
                rows.size(),
                attempt.getSubmittedAt(),
                selected,
                key,
                explanations,
                evidence,
                attempt.getType().name(),
                attempt.getPracticeSkill() == null ? null : attempt.getPracticeSkill().name(),
                analysis);
    }

    private ReadingAttempt saveAttempt(
            ReadingActivity activity,
            User student,
            List<ReadingQuestion> questions,
            ReadingSubmitRequest request,
            ReadingAttempt.Type type,
            ReadingQuestion.SkillType skillType,
            Integer assessmentSlot) {
        if (request == null) {
            throw new IllegalArgumentException("Thiếu câu trả lời Reading");
        }
        ReadingAttempt attempt = new ReadingAttempt();
        attempt.setActivity(activity);
        attempt.setStudent(student);
        attempt.setType(type);
        attempt.setPracticeSkill(skillType);
        attempt.setAssessmentSlot(assessmentSlot);
        attempts.save(attempt);
        int correct = 0;
        for (ReadingQuestion question : questions) {
            Long optionId = request.answers() == null ? null : request.answers().get(question.getId());
            ReadingOption option =
                    question.getOptions().stream()
                            .filter(candidate -> Objects.equals(candidate.getId(), optionId))
                            .findFirst()
                            .orElse(null);
            ReadingAnswer answer = new ReadingAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            answer.setOption(option);
            answer.setCorrect(option != null && option.isCorrect());
            answers.save(answer);
            if (answer.isCorrect()) correct++;
        }
        attempt.setScore(
                BigDecimal.valueOf(correct * 100.0 / questions.size())
                        .setScale(2, RoundingMode.HALF_UP));
        return attempts.save(attempt);
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(
                        () -> new IllegalArgumentException("Không tìm thấy học viên đang hoạt động"));
    }
}
