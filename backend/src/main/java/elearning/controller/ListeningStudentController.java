package elearning.controller;

import elearning.dto.ListeningDto.AttemptSummary;
import elearning.dto.ListeningDto.ListeningResponse;
import elearning.dto.ListeningDto.ListeningResultResponse;
import elearning.dto.ListeningDto.ListeningSubmitRequest;
import elearning.dto.ListeningDto.QuestionReview;
import elearning.dto.ListeningDto.SkillAnalysis;
import elearning.entity.ClassEnrollment;
import elearning.entity.ListeningActivity;
import elearning.entity.ListeningAnswer;
import elearning.entity.ListeningAttempt;
import elearning.entity.ListeningOption;
import elearning.entity.ListeningQuestion;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.ListeningAnswerRepository;
import elearning.repository.ListeningAttemptRepository;
import elearning.repository.ListeningQuestionRepository;
import elearning.repository.UserRepository;
import elearning.service.LessonService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@org.springframework.transaction.annotation.Transactional
@RestController
@RequestMapping("/api/listening")
@PreAuthorize("hasRole('STUDENT')")
public class ListeningStudentController {
    private final ListeningActivityRepository acts;
    private final ListeningQuestionRepository qs;
    private final ListeningAttemptRepository attempts;
    private final ListeningAnswerRepository answers;
    private final UserRepository users;
    private final ClassEnrollmentRepository enrollments;
    private final LessonService lessonService;

    public ListeningStudentController(
            ListeningActivityRepository a,
            ListeningQuestionRepository q,
            ListeningAttemptRepository at,
            ListeningAnswerRepository an,
            UserRepository u,
            ClassEnrollmentRepository e,
            LessonService lessonService) {
        acts = a;
        qs = q;
        attempts = at;
        answers = an;
        users = u;
        enrollments = e;
        this.lessonService = lessonService;
    }

    /**
     * Không kèm giải thích, transcript hay khoảng audio của câu hỏi: chỉ có trong kết quả sau khi
     * nộp bài.
     */
    @GetMapping("/{id}")
    public ListeningResponse get(Principal p, @PathVariable Long id) {
        User student = student(p.getName());
        ListeningActivity a = publishedActivity(id);
        requireEnrollment(student, a);
        requireLessonAccess(student, a);
        return studentView(a, qs.findAllByActivityIdOrderBySortOrderAsc(id));
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<ListeningResultResponse> latestResult(
            Principal p, @PathVariable Long id) {
        User student = student(p.getName());
        ListeningActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        return attempts.findFirstByActivityIdAndStudentIdAndAssessmentSlot(id, student.getId(), 1)
                .map(this::result)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Lịch sử mọi lần làm bài này (chính thức và luyện), mới nhất trước. */
    @GetMapping("/{id}/history")
    public List<AttemptSummary> history(Principal p, @PathVariable Long id) {
        User student = student(p.getName());
        ListeningActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        return attempts.findAllByActivityIdAndStudentIdOrderBySubmittedAtDescIdDesc(id, student.getId())
                .stream()
                .map(this::summary)
                .toList();
    }

    @GetMapping("/{id}/practice/{skillType}")
    public ListeningResponse practice(
            Principal p,
            @PathVariable Long id,
            @PathVariable ListeningQuestion.SkillType skillType) {
        User student = student(p.getName());
        ListeningActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        requireAssessmentDone(student, activity);
        return studentView(activity, practiceQuestions(id, skillType));
    }

    @GetMapping("/{id}/practice/{skillType}/result")
    public ResponseEntity<ListeningResultResponse> latestPracticeResult(
            Principal p,
            @PathVariable Long id,
            @PathVariable ListeningQuestion.SkillType skillType) {
        User student = student(p.getName());
        ListeningActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        return attempts
                .findFirstByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDescIdDesc(
                        id, student.getId(), ListeningAttempt.Type.TARGETED_PRACTICE, skillType)
                .map(this::result)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}/practice/{skillType}/history")
    public List<AttemptSummary> practiceHistory(
            Principal p,
            @PathVariable Long id,
            @PathVariable ListeningQuestion.SkillType skillType) {
        User student = student(p.getName());
        ListeningActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        return attempts
                .findAllByActivityIdAndStudentIdAndTypeAndPracticeSkillOrderBySubmittedAtDescIdDesc(
                        id, student.getId(), ListeningAttempt.Type.TARGETED_PRACTICE, skillType)
                .stream()
                .map(this::summary)
                .toList();
    }

    @PostMapping("/{id}/submit")
    public ListeningResultResponse submit(
            Principal p, @PathVariable Long id, @RequestBody ListeningSubmitRequest r) {
        User st = student(p.getName());
        ListeningActivity a = publishedActivity(id);
        requireEnrollment(st, a);
        requireLessonAccess(st, a);

        // Lượt chính thức là duy nhất: mở lại trang hay bấm nộp hai lần chỉ trả kết quả đã lưu.
        var existing =
                attempts.findFirstByActivityIdAndStudentIdAndAssessmentSlot(id, st.getId(), 1);
        if (existing.isPresent()) return result(existing.get());

        ListeningAttempt at =
                saveAttempt(
                        a,
                        st,
                        qs.findAllByActivityIdOrderBySortOrderAsc(id),
                        r,
                        ListeningAttempt.Type.ASSESSMENT,
                        null,
                        1);
        lessonService.autoComplete(st, a.getLesson());
        return result(at);
    }

    /** Luyện lại theo một kỹ năng; chỉ mở sau khi đã nộp bài chính thức, không ảnh hưởng điểm lớp. */
    @PostMapping("/{id}/practice/{skillType}/submit")
    public ListeningResultResponse submitPractice(
            Principal p,
            @PathVariable Long id,
            @PathVariable ListeningQuestion.SkillType skillType,
            @RequestBody ListeningSubmitRequest r) {
        User st = student(p.getName());
        ListeningActivity a = publishedActivity(id);
        requireEnrollment(st, a);
        requireLessonAccess(st, a);
        requireAssessmentDone(st, a);
        return result(
                saveAttempt(
                        a,
                        st,
                        practiceQuestions(id, skillType),
                        r,
                        ListeningAttempt.Type.TARGETED_PRACTICE,
                        skillType,
                        null));
    }

    private ListeningResponse studentView(ListeningActivity a, List<ListeningQuestion> questions) {
        return new ListeningResponse(
                a.getId(),
                a.getCourseWeek().getId(),
                a.getLesson() == null ? null : a.getLesson().getId(),
                a.getTitle(),
                a.getDescription(),
                a.getInstruction(),
                a.getAudioUrl(),
                a.getStatus().name(),
                questions.stream()
                        .map(
                                q ->
                                        new ListeningResponse.Question(
                                                q.getId(),
                                                q.getQuestionText(),
                                                q.getOptions().stream()
                                                        .map(
                                                                o ->
                                                                        new ListeningResponse.Option(
                                                                                o.getId(),
                                                                                o.getOptionText(),
                                                                                false))
                                                        .toList(),
                                                q.getSkillType(),
                                                null,
                                                null,
                                                null,
                                                null))
                        .toList(),
                false,
                0,
                null);
    }

    private List<ListeningQuestion> practiceQuestions(Long id, ListeningQuestion.SkillType skill) {
        List<ListeningQuestion> selected =
                qs.findAllByActivityIdOrderBySortOrderAsc(id).stream()
                        .filter(q -> q.getSkillType() == skill)
                        .toList();
        if (selected.isEmpty()) {
            throw new IllegalArgumentException(
                    "Bài nghe chưa có câu hỏi thuộc kỹ năng " + skill.name());
        }
        return selected;
    }

    private void requireAssessmentDone(User student, ListeningActivity activity) {
        if (!attempts.existsByActivityIdAndStudentIdAndAssessmentSlot(
                activity.getId(), student.getId(), 1)) {
            throw new IllegalArgumentException(
                    "Hãy hoàn thành bài nghe chính thức trước khi luyện tập theo kỹ năng");
        }
    }

    private ListeningAttempt saveAttempt(
            ListeningActivity activity,
            User student,
            List<ListeningQuestion> questions,
            ListeningSubmitRequest request,
            ListeningAttempt.Type type,
            ListeningQuestion.SkillType skillType,
            Integer assessmentSlot) {
        if (request == null) throw new IllegalArgumentException("Thiếu câu trả lời Listening");
        ListeningAttempt at = new ListeningAttempt();
        at.setActivity(activity);
        at.setStudent(student);
        at.setType(type);
        at.setPracticeSkill(skillType);
        at.setAssessmentSlot(assessmentSlot);
        attempts.save(at);
        int total = 0, correct = 0;
        for (ListeningQuestion q : questions) {
            total++;
            Long oid = request.answers() == null ? null : request.answers().get(q.getId());
            ListeningOption opt =
                    q.getOptions().stream()
                            .filter(o -> Objects.equals(o.getId(), oid))
                            .findFirst()
                            .orElse(null);
            ListeningAnswer an = new ListeningAnswer();
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
                        : BigDecimal.valueOf(correct * 100.0 / total)
                                .setScale(2, java.math.RoundingMode.HALF_UP));
        return attempts.save(at);
    }

    private AttemptSummary summary(ListeningAttempt attempt) {
        List<ListeningAnswer> rows = answers.findAllByAttemptId(attempt.getId());
        return new AttemptSummary(
                attempt.getId(),
                attempt.getType().name(),
                attempt.getPracticeSkill() == null ? null : attempt.getPracticeSkill().name(),
                attempt.getScore(),
                (int) rows.stream().filter(ListeningAnswer::isCorrect).count(),
                rows.size(),
                attempt.getSubmittedAt());
    }

    private ListeningResultResponse result(ListeningAttempt attempt) {
        List<ListeningAnswer> rows = answers.findAllByAttemptId(attempt.getId());
        int total = rows.size();
        int correct = (int) rows.stream().filter(ListeningAnswer::isCorrect).count();
        Map<Long, Long> selected = new LinkedHashMap<>();
        Map<Long, Long> key = new LinkedHashMap<>();
        Map<Long, QuestionReview> reviews = new LinkedHashMap<>();
        Map<String, int[]> skillCounts = new LinkedHashMap<>();
        rows.stream()
                .sorted(java.util.Comparator.comparing(row -> row.getQuestion().getSortOrder()))
                .forEach(
                        row -> {
                            ListeningQuestion q = row.getQuestion();
                            selected.put(
                                    q.getId(), row.getOption() == null ? null : row.getOption().getId());
                            q.getOptions().stream()
                                    .filter(ListeningOption::isCorrect)
                                    .findFirst()
                                    .ifPresent(o -> key.put(q.getId(), o.getId()));
                            reviews.put(
                                    q.getId(),
                                    new QuestionReview(
                                            q.getExplanation(),
                                            q.getTranscriptExcerpt(),
                                            q.getAudioStartSec(),
                                            q.getAudioEndSec()));
                            int[] counts =
                                    skillCounts.computeIfAbsent(
                                            q.getSkillType().name(), ignored -> new int[2]);
                            counts[1]++;
                            if (row.isCorrect()) counts[0]++;
                        });
        Map<String, SkillAnalysis> analysis = new LinkedHashMap<>();
        skillCounts.forEach(
                (skill, counts) ->
                        analysis.put(
                                skill,
                                new SkillAnalysis(
                                        counts[0],
                                        counts[1],
                                        BigDecimal.valueOf(counts[0] * 100.0 / counts[1])
                                                .setScale(2, java.math.RoundingMode.HALF_UP))));
        boolean assessment = attempt.getType() == ListeningAttempt.Type.ASSESSMENT;
        return new ListeningResultResponse(
                attempt.getId(),
                attempt.getScore(),
                correct,
                total,
                attempt.getSubmittedAt(),
                selected,
                key,
                reviews,
                assessment ? attempt.getActivity().getTranscript() : null,
                attempt.getType().name(),
                attempt.getPracticeSkill() == null ? null : attempt.getPracticeSkill().name(),
                analysis);
    }

    private ListeningActivity publishedActivity(Long id) {
        return acts.findById(id)
                .filter(x -> x.getStatus() == ListeningActivity.Status.PUBLISHED)
                .filter(x -> x.getCourseWeek() != null
                        && x.getCourseWeek().getStatus() == elearning.entity.CourseWeek.Status.PUBLISHED
                        && x.getCourseWeek().getCourse().getStatus() == elearning.entity.Course.Status.PUBLISHED)
                .filter(x -> x.getLesson() == null || x.getLesson().getStatus() == elearning.entity.Lesson.Status.PUBLISHED)
                .orElseThrow(
                        () ->
                                new elearning.exception.ContentNotFoundException(
                                        "Không tìm thấy bài Listening"));
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(
                        () -> new IllegalArgumentException("Không tìm thấy học viên đang hoạt động"));
    }

    private void requireLessonAccess(User student, ListeningActivity activity) {
        if (activity.getLesson() != null) {
            lessonService.requireStudentAccess(student, activity.getLesson());
        }
    }

    private void requireEnrollment(User student, ListeningActivity activity) {
        Long courseId = activity.getCourseWeek().getCourse().getId();
        if (!enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                student.getId(), courseId, ClassEnrollment.Status.ACTIVE)) {
            throw elearning.exception.LearningAccessException.notEnrolled(
                    "Bạn cần tham gia một lớp của khóa học trước khi làm bài Listening", courseId);
        }
    }
}
