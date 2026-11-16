package elearning.service;

import elearning.dto.GrammarExerciseDto.AttemptResult;
import elearning.dto.GrammarExerciseDto.AttemptSummary;
import elearning.dto.GrammarExerciseDto.ExerciseAnswer;
import elearning.dto.GrammarExerciseDto.ExerciseRequest;
import elearning.dto.GrammarExerciseDto.ExerciseStat;
import elearning.dto.GrammarExerciseDto.ItemResult;
import elearning.dto.GrammarExerciseDto.SaveExercisesRequest;
import elearning.dto.GrammarExerciseDto.StudentExercise;
import elearning.dto.GrammarExerciseDto.StudentExercisesResponse;
import elearning.dto.GrammarExerciseDto.StudentOption;
import elearning.dto.GrammarExerciseDto.SubmitRequest;
import elearning.dto.GrammarExerciseDto.TeacherExercise;
import elearning.dto.GrammarExerciseDto.TeacherExercisesResponse;
import elearning.dto.GrammarExerciseDto.TeacherOption;
import elearning.dto.GrammarExerciseDto.TopicStats;
import elearning.entity.GrammarExercise;
import elearning.entity.GrammarExerciseAnswer;
import elearning.entity.GrammarExerciseAttempt;
import elearning.entity.GrammarExerciseOption;
import elearning.entity.GrammarTopic;
import elearning.entity.StudentGrammarProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.GrammarExerciseAnswerRepository;
import elearning.repository.GrammarExerciseAttemptRepository;
import elearning.repository.GrammarExerciseRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.StudentGrammarProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/** Bài tập sau chủ đề ngữ pháp: soạn (giáo viên), làm bài và chấm (học viên), thống kê lỗi. */
@Service
@Transactional
public class GrammarExerciseService {
    private final GrammarTopicRepository topics;
    private final GrammarExerciseRepository exercises;
    private final GrammarExerciseAttemptRepository attempts;
    private final GrammarExerciseAnswerRepository answers;
    private final StudentGrammarProgressRepository progress;
    private final UserRepository users;
    private final GrammarService grammarService;
    private final ProgressService tracking;

    public GrammarExerciseService(
            GrammarTopicRepository topics,
            GrammarExerciseRepository exercises,
            GrammarExerciseAttemptRepository attempts,
            GrammarExerciseAnswerRepository answers,
            StudentGrammarProgressRepository progress,
            UserRepository users,
            GrammarService grammarService,
            ProgressService tracking) {
        this.topics = topics;
        this.exercises = exercises;
        this.attempts = attempts;
        this.answers = answers;
        this.progress = progress;
        this.users = users;
        this.grammarService = grammarService;
        this.tracking = tracking;
    }

    // ------------------------------------------------------------------ giáo viên

    @Transactional(readOnly = true)
    public TeacherExercisesResponse teacherExercises(String email, Long topicId) {
        GrammarTopic topic = ownedTopic(email, topicId);
        return teacherResponse(topic);
    }

    public TeacherExercisesResponse saveExercises(
            String email, Long topicId, SaveExercisesRequest request) {
        GrammarTopic topic = ownedTopic(email, topicId);
        if (attempts.existsByGrammarTopicId(topicId)) {
            throw new IllegalArgumentException(
                    "Đã có học viên làm bài tập của chủ đề này nên không thể sửa để bảo toàn kết quả.");
        }
        topic.setPassScore(request.passScore());
        topics.save(topic);
        for (GrammarExercise old : exercises.findAllByGrammarTopicIdOrderBySortOrderAsc(topicId)) {
            exercises.delete(old);
        }
        exercises.flush();
        int order = 1;
        for (ExerciseRequest r : request.exercises()) {
            GrammarExercise e = new GrammarExercise();
            e.setGrammarTopic(topic);
            e.setType(r.type());
            e.setQuestionText(r.questionText().trim());
            e.setExplanation(clean(r.explanation()));
            e.setSortOrder(order++);
            if (r.type() == GrammarExercise.Type.FILL_BLANK) {
                List<String> accepted = acceptedAnswers(r.correctAnswer());
                if (accepted.isEmpty()) {
                    throw new IllegalArgumentException("Câu điền chỗ trống cần ít nhất một đáp án");
                }
                e.setCorrectAnswer(String.join("|", accepted));
            } else {
                int oi = 1;
                for (var o : r.options()) {
                    GrammarExerciseOption option = new GrammarExerciseOption();
                    option.setExercise(e);
                    option.setOptionText(o.optionText().trim());
                    option.setCorrect(o.correct());
                    option.setSortOrder(oi++);
                    e.getOptions().add(option);
                }
            }
            exercises.save(e);
        }
        return teacherResponse(topic);
    }

    @Transactional(readOnly = true)
    public TopicStats stats(String email, Long topicId) {
        GrammarTopic topic = ownedTopic(email, topicId);
        return statsFor(topic, attempts.findAllByGrammarTopicId(topicId));
    }

    /** Thống kê cho nhiều chủ đề cùng lúc (dùng ở dashboard giáo viên). */
    @Transactional(readOnly = true)
    public List<TopicStats> statsForTopics(List<GrammarTopic> ownedTopics) {
        if (ownedTopics.isEmpty()) return List.of();
        Map<Long, List<GrammarExerciseAttempt>> byTopic = new HashMap<>();
        for (GrammarExerciseAttempt a :
                attempts.findAllByGrammarTopicIdIn(
                        ownedTopics.stream().map(GrammarTopic::getId).toList())) {
            byTopic.computeIfAbsent(a.getGrammarTopic().getId(), k -> new ArrayList<>()).add(a);
        }
        List<TopicStats> result = new ArrayList<>();
        for (GrammarTopic topic : ownedTopics) {
            List<GrammarExerciseAttempt> list = byTopic.getOrDefault(topic.getId(), List.of());
            if (!list.isEmpty()) result.add(statsFor(topic, list));
        }
        return result;
    }

    private TopicStats statsFor(GrammarTopic topic, List<GrammarExerciseAttempt> list) {
        List<GrammarExercise> items =
                exercises.findAllByGrammarTopicIdOrderBySortOrderAsc(topic.getId());
        Set<Long> students = new HashSet<>();
        Set<Long> passedStudents = new HashSet<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (GrammarExerciseAttempt a : list) {
            students.add(a.getStudent().getId());
            if (a.isPassed()) passedStudents.add(a.getStudent().getId());
            sum = sum.add(a.getScore());
        }
        BigDecimal average =
                list.isEmpty()
                        ? null
                        : sum.divide(BigDecimal.valueOf(list.size()), 2, RoundingMode.HALF_UP);
        BigDecimal passRate =
                students.isEmpty()
                        ? null
                        : BigDecimal.valueOf(passedStudents.size() * 100.0 / students.size())
                                .setScale(2, RoundingMode.HALF_UP);

        Map<Long, int[]> perExercise = new LinkedHashMap<>();
        if (!list.isEmpty()) {
            for (GrammarExerciseAnswer answer :
                    answers.findAllByAttemptIdIn(
                            list.stream().map(GrammarExerciseAttempt::getId).toList())) {
                int[] c =
                        perExercise.computeIfAbsent(answer.getExercise().getId(), k -> new int[2]);
                c[0]++;
                if (!answer.isCorrect()) c[1]++;
            }
        }
        List<ExerciseStat> hardest = new ArrayList<>();
        for (GrammarExercise e : items) {
            int[] c = perExercise.get(e.getId());
            if (c == null || c[0] == 0) continue;
            hardest.add(
                    new ExerciseStat(
                            e.getId(),
                            e.getQuestionText(),
                            c[0],
                            c[1],
                            BigDecimal.valueOf(c[1] * 100.0 / c[0])
                                    .setScale(2, RoundingMode.HALF_UP)));
        }
        hardest.sort(Comparator.comparing(ExerciseStat::wrongRate).reversed());
        return new TopicStats(
                topic.getId(),
                topic.getTitle(),
                items.size(),
                list.size(),
                students.size(),
                passedStudents.size(),
                average,
                passRate,
                hardest.stream().limit(5).toList());
    }

    // ------------------------------------------------------------------ học viên

    @Transactional(readOnly = true)
    public StudentExercisesResponse studentExercises(String email, Long topicId) {
        User student = student(email);
        GrammarTopic topic = accessibleTopic(email, topicId);
        List<GrammarExercise> items =
                exercises.findAllByGrammarTopicIdOrderBySortOrderAsc(topicId);
        StudentGrammarProgress p =
                progress.findByStudentIdAndGrammarTopicId(student.getId(), topicId).orElse(null);
        return new StudentExercisesResponse(
                topicId,
                topic.getPassScore(),
                p == null ? StudentGrammarProgress.Mastery.NEW.name() : p.getMastery().name(),
                p == null ? null : p.getBestScore(),
                p == null ? null : p.getLastScore(),
                p == null ? 0 : p.getExerciseAttempts(),
                items.stream()
                        .map(
                                e ->
                                        new StudentExercise(
                                                e.getId(),
                                                e.getType().name(),
                                                e.getQuestionText(),
                                                e.getOptions().stream()
                                                        .map(
                                                                o ->
                                                                        new StudentOption(
                                                                                o.getId(),
                                                                                o.getOptionText()))
                                                        .toList()))
                        .toList());
    }

    public AttemptResult submit(String email, Long topicId, SubmitRequest request) {
        User student = student(email);
        accessibleTopic(email, topicId);
        // Khóa chủ đề: hai lần nộp đồng thời của cùng học viên không tạo trùng bản ghi tiến độ.
        GrammarTopic topic =
                topics.lockById(topicId)
                        .orElseThrow(
                                () -> new ContentNotFoundException("Không tìm thấy chủ đề ngữ pháp"));
        List<GrammarExercise> items =
                exercises.findAllByGrammarTopicIdOrderBySortOrderAsc(topicId);
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Chủ đề này chưa có bài tập");
        }
        if (request == null) throw new IllegalArgumentException("Thiếu câu trả lời");
        Map<Long, ExerciseAnswer> given = request.answers() == null ? Map.of() : request.answers();

        GrammarExerciseAttempt attempt = new GrammarExerciseAttempt();
        attempt.setStudent(student);
        attempt.setGrammarTopic(topic);
        attempt.setPassScore(topic.getPassScore());
        attempts.save(attempt);

        int correct = 0;
        List<ItemResult> results = new ArrayList<>();
        for (GrammarExercise e : items) {
            ExerciseAnswer a = given.get(e.getId());
            GrammarExerciseAnswer row = new GrammarExerciseAnswer();
            row.setAttempt(attempt);
            row.setExercise(e);
            Long selectedId = null;
            String text = null;
            boolean ok;
            Long correctOptionId = null;
            String correctAnswer = null;
            if (e.getType() == GrammarExercise.Type.FILL_BLANK) {
                text = a == null || a.text() == null ? null : a.text().trim();
                ok = text != null && matches(text, e.getCorrectAnswer());
                correctAnswer = e.getCorrectAnswer() == null ? null : String.join(" / ", acceptedAnswers(e.getCorrectAnswer()));
                row.setAnswerText(text);
            } else {
                GrammarExerciseOption chosen = null;
                if (a != null && a.optionId() != null) {
                    chosen =
                            e.getOptions().stream()
                                    .filter(o -> Objects.equals(o.getId(), a.optionId()))
                                    .findFirst()
                                    .orElse(null);
                }
                ok = chosen != null && chosen.isCorrect();
                selectedId = chosen == null ? null : chosen.getId();
                correctOptionId =
                        e.getOptions().stream()
                                .filter(GrammarExerciseOption::isCorrect)
                                .map(GrammarExerciseOption::getId)
                                .findFirst()
                                .orElse(null);
                row.setOption(chosen);
            }
            row.setCorrect(ok);
            answers.save(row);
            if (ok) correct++;
            results.add(
                    new ItemResult(
                            e.getId(),
                            ok,
                            selectedId,
                            text,
                            correctOptionId,
                            correctAnswer,
                            e.getExplanation()));
        }
        BigDecimal score =
                BigDecimal.valueOf(correct * 100.0 / items.size()).setScale(2, RoundingMode.HALF_UP);
        boolean passed = score.compareTo(BigDecimal.valueOf(topic.getPassScore())) >= 0;
        attempt.setScore(score);
        attempt.setCorrectCount(correct);
        attempt.setTotalCount(items.size());
        attempt.setPassed(passed);
        attempts.save(attempt);

        StudentGrammarProgress p =
                progress.findByStudentIdAndGrammarTopicId(student.getId(), topicId)
                        .orElseGet(
                                () -> {
                                    StudentGrammarProgress n = new StudentGrammarProgress();
                                    n.setStudent(student);
                                    n.setGrammarTopic(topic);
                                    return n;
                                });
        LocalDateTime now = LocalDateTime.now();
        boolean firstCompletion = p.getStatus() != StudentGrammarProgress.Status.COMPLETED;
        p.setExerciseAttempts(p.getExerciseAttempts() + 1);
        p.setLastScore(score);
        p.setBestScore(p.getBestScore() == null || score.compareTo(p.getBestScore()) > 0 ? score : p.getBestScore());
        p.setLastPracticedAt(now);
        p.setLastAccessedAt(now);
        p.setMastery(
                passed
                        ? StudentGrammarProgress.Mastery.MASTERED
                        : StudentGrammarProgress.Mastery.LEARNING);
        if (passed) {
            p.setStatus(StudentGrammarProgress.Status.COMPLETED);
            p.setProgressPercent(new BigDecimal("100.00"));
        } else if (p.getStatus() == StudentGrammarProgress.Status.NOT_STARTED) {
            p.setStatus(StudentGrammarProgress.Status.LEARNING);
            p.setProgressPercent(new BigDecimal("50.00"));
        }
        progress.save(p);
        if (passed) tracking.recordGrammarCompleted(student, topic, firstCompletion);

        return new AttemptResult(
                attempt.getId(),
                score,
                correct,
                items.size(),
                passed,
                topic.getPassScore(),
                attempt.getSubmittedAt(),
                p.getMastery().name(),
                p.getStatus().name(),
                results);
    }

    @Transactional(readOnly = true)
    public List<AttemptSummary> history(String email, Long topicId) {
        User student = student(email);
        accessibleTopic(email, topicId);
        return attempts
                .findAllByStudentIdAndGrammarTopicIdOrderBySubmittedAtDescIdDesc(student.getId(), topicId)
                .stream()
                .map(
                        a ->
                                new AttemptSummary(
                                        a.getId(),
                                        a.getScore(),
                                        a.getCorrectCount(),
                                        a.getTotalCount(),
                                        a.isPassed(),
                                        a.getSubmittedAt()))
                .toList();
    }

    // ------------------------------------------------------------------ chấm điểm

    /** Chuẩn hóa để so sánh đáp án điền: bỏ hoa/thường, khoảng trắng thừa, dấu câu cuối câu. */
    static String normalize(String value) {
        if (value == null) return "";
        String s = Normalizer.normalize(value, Normalizer.Form.NFC);
        s = s.replace('’', '\'').replace('‘', '\'').replace('“', '"').replace('”', '"');
        s = s.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        return s.replaceAll("[\\s.!?,;:]+$", "");
    }

    static List<String> acceptedAnswers(String raw) {
        List<String> result = new ArrayList<>();
        if (raw == null) return result;
        for (String part : raw.split("\\|")) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) result.add(trimmed);
        }
        return result;
    }

    static boolean matches(String given, String correctAnswers) {
        String candidate = normalize(given);
        if (candidate.isEmpty()) return false;
        return acceptedAnswers(correctAnswers).stream().anyMatch(a -> normalize(a).equals(candidate));
    }

    // ------------------------------------------------------------------ helpers

    private TeacherExercisesResponse teacherResponse(GrammarTopic topic) {
        return new TeacherExercisesResponse(
                topic.getId(),
                topic.getPassScore(),
                attempts.existsByGrammarTopicId(topic.getId()),
                exercises.findAllByGrammarTopicIdOrderBySortOrderAsc(topic.getId()).stream()
                        .map(
                                e ->
                                        new TeacherExercise(
                                                e.getId(),
                                                e.getType().name(),
                                                e.getQuestionText(),
                                                e.getCorrectAnswer(),
                                                e.getExplanation(),
                                                e.getOptions().stream()
                                                        .map(
                                                                o ->
                                                                        new TeacherOption(
                                                                                o.getId(),
                                                                                o.getOptionText(),
                                                                                o.isCorrect()))
                                                        .toList()))
                        .toList());
    }

    private GrammarTopic ownedTopic(String email, Long topicId) {
        User teacher =
                users.findByEmailIgnoreCase(email)
                        .filter(u -> u.getRole() == UserRole.TEACHER && u.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giáo viên"));
        return topics.findByIdAndCreatedByTeacherId(topicId, teacher.getId())
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy chủ đề ngữ pháp"));
    }

    /** Dùng lại kiểm tra ghi danh / bài bị khóa / ẩn của trang đọc chủ đề. */
    private GrammarTopic accessibleTopic(String email, Long topicId) {
        grammarService.studentTopic(email, topicId);
        return topics.findByIdAndStatus(topicId, GrammarTopic.Status.PUBLISHED)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy chủ đề ngữ pháp"));
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));
    }

    private static String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
