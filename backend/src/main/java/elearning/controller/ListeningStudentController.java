package elearning.controller;

import elearning.dto.ListeningDto.ListeningResponse;
import elearning.dto.ListeningDto.ListeningResultResponse;
import elearning.dto.ListeningDto.ListeningSubmitRequest;
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

    @GetMapping("/{id}")
    public ListeningResponse get(Principal p, @PathVariable Long id) {
        User student = student(p.getName());
        ListeningActivity a = publishedActivity(id);
        requireEnrollment(student, a);
        requireLessonAccess(student, a);
        return new ListeningResponse(
                a.getId(),
                a.getCourseWeek().getId(),
                a.getLesson() == null ? null : a.getLesson().getId(),
                a.getTitle(),
                a.getDescription(),
                a.getInstruction(),
                a.getAudioUrl(),
                a.getStatus().name(),
                qs.findAllByActivityIdOrderBySortOrderAsc(id).stream()
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
                                                        .toList()))
                        .toList(),
                false,
                0);
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<ListeningResultResponse> latestResult(
            Principal p, @PathVariable Long id) {
        User student = student(p.getName());
        ListeningActivity activity = publishedActivity(id);
        requireEnrollment(student, activity);
        requireLessonAccess(student, activity);
        return attempts.findTopByActivityIdAndStudentIdOrderBySubmittedAtDesc(id, student.getId())
                .map(this::result)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/submit")
    public ListeningResultResponse submit(
            Principal p, @PathVariable Long id, @RequestBody ListeningSubmitRequest r) {
        User st = student(p.getName());
        ListeningActivity a = publishedActivity(id);
        requireEnrollment(st, a);
        requireLessonAccess(st, a);

        // A completed listening activity is persisted. Re-opening the page must show that result,
        // not silently create another attempt because the user clicked submit twice or refreshed.
        var existing =
                attempts.findTopByActivityIdAndStudentIdOrderBySubmittedAtDesc(id, st.getId());
        if (existing.isPresent()) return result(existing.get());

        ListeningAttempt at = new ListeningAttempt();
        at.setActivity(a);
        at.setStudent(st);
        attempts.save(at);
        int total = 0, correct = 0;
        for (ListeningQuestion q : qs.findAllByActivityIdOrderBySortOrderAsc(id)) {
            total++;
            Long oid = r.answers() == null ? null : r.answers().get(q.getId());
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
        attempts.save(at);
        lessonService.autoComplete(st, a.getLesson());
        return result(at);
    }

    private ListeningResultResponse result(ListeningAttempt attempt) {
        List<ListeningAnswer> rows = answers.findAllByAttemptId(attempt.getId());
        int total = rows.size();
        int correct = (int) rows.stream().filter(ListeningAnswer::isCorrect).count();
        Map<Long, Long> selected = new LinkedHashMap<>();
        rows.stream()
                .sorted(
                        java.util.Comparator.comparing(
                                row -> row.getQuestion().getSortOrder()))
                .forEach(
                        row ->
                                selected.put(
                                        row.getQuestion().getId(),
                                        row.getOption() == null ? null : row.getOption().getId()));
        return new ListeningResultResponse(
                attempt.getId(),
                attempt.getScore(),
                correct,
                total,
                attempt.getSubmittedAt(),
                selected,
                correctAnswers(attempt.getActivity().getId()));
    }

    /** Câu → đáp án đúng, để trang kết quả chỉ ra câu nào sai và đáp án đúng là gì. */
    private Map<Long, Long> correctAnswers(Long activityId) {
        Map<Long, Long> correct = new LinkedHashMap<>();
        for (ListeningQuestion q : qs.findAllByActivityIdOrderBySortOrderAsc(activityId))
            q.getOptions().stream()
                    .filter(o -> o.isCorrect())
                    .findFirst()
                    .ifPresent(o -> correct.put(q.getId(), o.getId()));
        return correct;
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
