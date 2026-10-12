package elearning.service;

import elearning.dto.AssessmentDto.AnswerReviewResponse;
import elearning.dto.AssessmentDto.ResultDetailResponse;
import elearning.dto.AssessmentDto.ResultSummaryResponse;
import elearning.dto.AssessmentDto.StartAttemptResponse;
import elearning.dto.AssessmentDto.StudentQuizResponse;
import elearning.dto.AssessmentDto.SubmitAnswerRequest;
import elearning.dto.AssessmentDto.SubmitAnswerResponse;
import elearning.entity.AnswerOption;
import elearning.entity.AnswerSubmission;
import elearning.entity.Question;
import elearning.entity.Quiz;
import elearning.entity.QuizAttempt;
import elearning.entity.QuizQuestion;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.AnswerOptionRepository;
import elearning.repository.AnswerSubmissionRepository;
import elearning.repository.QuizAttemptRepository;
import elearning.repository.QuizQuestionRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuizAttemptService {
    private final QuizAttemptRepository attempts;
    private final AnswerSubmissionRepository submissions;
    private final QuizQuestionRepository quizQuestions;
    private final AnswerOptionRepository options;
    private final QuizService quizService;
    private final UserRepository users;
    private final ProgressService tracking;
    private final LessonService lessonService;

    public QuizAttemptService(
            QuizAttemptRepository a,
            AnswerSubmissionRepository s,
            QuizQuestionRepository q,
            AnswerOptionRepository o,
            QuizService qs,
            UserRepository u,
            ProgressService ps,
            LessonService ls) {
        attempts = a;
        submissions = s;
        quizQuestions = q;
        options = o;
        quizService = qs;
        users = u;
        tracking = ps;
        lessonService = ls;
    }

    public StartAttemptResponse start(String email, Long quizId) {
        User student = student(email);
        Quiz quiz = quizService.publishedQuiz(quizId);
        quizService.requireStudentAccess(student, quiz);
        StudentQuizResponse view = quizService.studentResponse(quiz);
        if (view.questions().isEmpty())
            throw new IllegalArgumentException("Bài kiểm tra chưa có câu hỏi");

        Optional<QuizAttempt> inProgress =
                attempts.findTopByQuizIdAndStudentIdAndStatusOrderByStartTimeDesc(
                        quizId, student.getId(), QuizAttempt.Status.IN_PROGRESS);
        Long autoSubmitted = null;
        if (inProgress.isPresent()) {
            QuizAttempt current = inProgress.get();
            if (LocalDateTime.now().isBefore(expiresAt(current))) {
                return startResponse(current, view, null);
            }
            // Lượt cũ đã hết giờ: chấm theo đáp án đã lưu và báo cho học viên biết.
            finish(email, current.getId());
            autoSubmitted = current.getId();
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setStudent(student);
        attempt.setQuiz(quiz);
        attempt.setStartTime(LocalDateTime.now());
        attempts.save(attempt);
        return startResponse(attempt, view, autoSubmitted);
    }

    private StartAttemptResponse startResponse(
            QuizAttempt attempt, StudentQuizResponse view, Long autoSubmittedAttemptId) {
        Map<Long, Long> saved = new LinkedHashMap<>();
        submissions.findAllByAttemptId(attempt.getId()).stream()
                .sorted(Comparator.comparing(item -> item.getQuestion().getId()))
                .forEach(
                        item ->
                                saved.put(
                                        item.getQuestion().getId(),
                                        item.getSelectedAnswer() == null
                                                ? null
                                                : item.getSelectedAnswer().getId()));
        return new StartAttemptResponse(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getQuiz().getTitle(),
                attempt.getQuiz().getTimeLimitMinutes(),
                attempt.getStartTime(),
                expiresAt(attempt),
                view.questions(),
                saved,
                autoSubmittedAttemptId);
    }

    public SubmitAnswerResponse answer(String email, Long attemptId, SubmitAnswerRequest r) {
        User student = student(email);
        QuizAttempt attempt = ownedAttempt(attemptId, student.getId());
        ensureOpen(attempt);
        // Học viên rời lớp hoặc bài bị khóa lại giữa chừng thì không lưu đáp án mới.
        quizService.requireStudentAccess(student, attempt.getQuiz());
        if (!quizQuestions.existsByQuizIdAndQuestionId(attempt.getQuiz().getId(), r.questionId()))
            throw new IllegalArgumentException("Câu hỏi không thuộc bài kiểm tra");
        AnswerOption selected =
                options.findByIdAndQuestionId(r.selectedAnswerId(), r.questionId())
                        .orElseThrow(
                                () -> new IllegalArgumentException("Đáp án không thuộc câu hỏi"));
        Question question = selected.getQuestion();
        AnswerSubmission submission =
                submissions
                        .findByAttemptIdAndQuestionId(attemptId, r.questionId())
                        .orElseGet(AnswerSubmission::new);
        submission.setAttempt(attempt);
        submission.setQuestion(question);
        submission.setSelectedAnswer(selected);
        submission.setCorrect(selected.isCorrect());
        submission.setSubmittedAt(LocalDateTime.now());
        submissions.save(submission);
        return new SubmitAnswerResponse(
                attemptId, r.questionId(), r.selectedAnswerId(), submission.getSubmittedAt());
    }

    public ResultDetailResponse finish(String email, Long attemptId) {
        User student = student(email);
        QuizAttempt attempt = ownedAttempt(attemptId, student.getId());
        if (attempt.getStatus() != QuizAttempt.Status.IN_PROGRESS) return detail(attempt);
        List<QuizQuestion> links = quizService.quizQuestions(attempt.getQuiz().getId());
        Map<Long, AnswerSubmission> answerMap =
                submissions.findAllByAttemptId(attemptId).stream()
                        .collect(
                                Collectors.toMap(
                                        x -> x.getQuestion().getId(), Function.identity()));
        int correct =
                (int)
                        links.stream()
                                .filter(
                                        link -> {
                                            AnswerSubmission a =
                                                    answerMap.get(link.getQuestion().getId());
                                            return a != null && a.isCorrect();
                                        })
                                .count();
        int total = links.size();
        attempt.setCorrectAnswers(correct);
        attempt.setWrongAnswers(total - correct);
        attempt.setScore(
                total == 0
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(correct * 100.0 / total)
                                .setScale(2, RoundingMode.HALF_UP));
        LocalDateTime now = LocalDateTime.now();
        attempt.setEndTime(now);
        attempt.setStatus(
                now.isAfter(expiresAt(attempt))
                        ? QuizAttempt.Status.AUTO_SUBMITTED
                        : QuizAttempt.Status.SUBMITTED);
        attempts.save(attempt);
        tracking.recordQuizCompleted(attempt);
        lessonService.autoComplete(attempt.getStudent(), attempt.getQuiz().getLesson());
        return detail(attempt);
    }

    @Transactional(readOnly = true)
    public List<ResultSummaryResponse> results(String email) {
        User user = currentUser(email);
        List<QuizAttempt> data =
                user.getRole() == UserRole.ADMIN
                        ? attempts.findAllByStatusNotOrderByStartTimeDesc(
                                QuizAttempt.Status.IN_PROGRESS)
                        : attempts.findAllByStudentIdAndStatusNotOrderByStartTimeDesc(
                                user.getId(), QuizAttempt.Status.IN_PROGRESS);
        return data.stream().map(this::summary).toList();
    }

    @Transactional(readOnly = true)
    public ResultDetailResponse result(String email, Long id) {
        User user = currentUser(email);
        QuizAttempt attempt =
                (user.getRole() == UserRole.ADMIN
                                ? attempts.findById(id)
                                : attempts.findByIdAndStudentId(id, user.getId()))
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy kết quả"));
        if (attempt.getStatus() == QuizAttempt.Status.IN_PROGRESS)
            throw new IllegalArgumentException("Bài kiểm tra chưa được nộp");
        return detail(attempt);
    }

    private ResultDetailResponse detail(QuizAttempt a) {
        Map<Long, AnswerSubmission> map =
                submissions.findAllByAttemptId(a.getId()).stream()
                        .collect(
                                Collectors.toMap(
                                        x -> x.getQuestion().getId(), Function.identity()));
        List<AnswerReviewResponse> reviews =
                quizService.quizQuestions(a.getQuiz().getId()).stream()
                        .map(
                                link -> {
                                    Question q = link.getQuestion();
                                    AnswerSubmission submitted = map.get(q.getId());
                                    AnswerOption selected =
                                            submitted == null
                                                    ? null
                                                    : submitted.getSelectedAnswer();
                                    AnswerOption correct =
                                            options
                                                    .findAllByQuestionIdOrderBySortOrderAsc(
                                                            q.getId())
                                                    .stream()
                                                    .filter(AnswerOption::isCorrect)
                                                    .findFirst()
                                                    .orElse(null);
                                    return new AnswerReviewResponse(
                                            q.getId(),
                                            q.getQuestionText(),
                                            selected == null ? null : selected.getId(),
                                            selected == null ? null : selected.getContent(),
                                            correct == null ? null : correct.getId(),
                                            correct == null ? null : correct.getContent(),
                                            q.getExplanation(),
                                            submitted != null && submitted.isCorrect());
                                })
                        .toList();
        return new ResultDetailResponse(
                a.getId(),
                a.getQuiz().getId(),
                a.getQuiz().getTitle(),
                a.getStartTime(),
                a.getEndTime(),
                a.getScore(),
                totalQuestions(a),
                a.getCorrectAnswers(),
                a.getWrongAnswers(),
                a.getStatus().name(),
                reviews);
    }

    /** Tổng câu khớp với số đúng + sai đã chấm (không dùng trường lưu sẵn có thể lệch). */
    private Integer totalQuestions(QuizAttempt a) {
        if (a.getCorrectAnswers() != null && a.getWrongAnswers() != null)
            return a.getCorrectAnswers() + a.getWrongAnswers();
        return a.getQuiz().getTotalQuestion();
    }

    private ResultSummaryResponse summary(QuizAttempt a) {
        return new ResultSummaryResponse(
                a.getId(),
                a.getQuiz().getId(),
                a.getQuiz().getTitle(),
                a.getStartTime(),
                a.getEndTime(),
                a.getScore(),
                totalQuestions(a),
                a.getCorrectAnswers(),
                a.getWrongAnswers(),
                a.getStatus().name());
    }

    private void ensureOpen(QuizAttempt a) {
        if (a.getStatus() != QuizAttempt.Status.IN_PROGRESS)
            throw new IllegalArgumentException("Bài kiểm tra đã kết thúc");
        if (LocalDateTime.now().isAfter(expiresAt(a)))
            throw new IllegalArgumentException("Đã hết thời gian làm bài, hãy nộp bài");
    }

    private LocalDateTime expiresAt(QuizAttempt a) {
        return a.getStartTime().plusMinutes(a.getQuiz().getTimeLimitMinutes());
    }

    private QuizAttempt ownedAttempt(Long id, Long studentId) {
        return attempts.findByIdAndStudentId(id, studentId)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy lượt làm bài"));
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));
    }

    private User currentUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        u ->
                                u.getStatus() == UserStatus.ACTIVE
                                        && (u.getRole() == UserRole.STUDENT
                                                || u.getRole() == UserRole.ADMIN))
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy người dùng"));
    }
}
