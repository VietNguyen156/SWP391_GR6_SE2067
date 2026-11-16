package elearning.service;

import elearning.dto.ExamPracticeDto.GrammarTopicPlan;
import elearning.dto.ExamPracticeDto.ListeningPracticeActivity;
import elearning.dto.ExamPracticeDto.ListeningSkillPlan;
import elearning.dto.ExamPracticeDto.PracticePlan;
import elearning.dto.ExamPracticeDto.ReadingPracticeActivity;
import elearning.dto.ExamPracticeDto.ReadingSkillPlan;
import elearning.dto.ExamPracticeDto.SpeakingPracticeActivity;
import elearning.dto.ExamPracticeDto.SpeakingSkillPlan;
import elearning.entity.ClassEnrollment;
import elearning.entity.Course;
import elearning.entity.CourseWeek;
import elearning.entity.GrammarTopic;
import elearning.entity.Lesson;
import elearning.entity.ListeningActivity;
import elearning.entity.ListeningAnswer;
import elearning.entity.ListeningQuestion;
import elearning.entity.StudentGrammarProgress;
import elearning.entity.ReadingActivity;
import elearning.entity.ReadingAnswer;
import elearning.entity.ReadingAttempt;
import elearning.entity.ReadingQuestion;
import elearning.entity.SpeakingActivity;
import elearning.entity.SpeakingSubmission;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.GrammarExerciseRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.ListeningAnswerRepository;
import elearning.repository.ListeningAttemptRepository;
import elearning.repository.ListeningQuestionRepository;
import elearning.repository.ReadingActivityRepository;
import elearning.repository.ReadingAnswerRepository;
import elearning.repository.ReadingAttemptRepository;
import elearning.repository.ReadingQuestionRepository;
import elearning.repository.SpeakingActivityRepository;
import elearning.repository.SpeakingSubmissionRepository;
import elearning.repository.StudentGrammarProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

@Service
public class ExamPracticeService {
    private static final BigDecimal PRACTICE_THRESHOLD = new BigDecimal("70.00");

    private final UserRepository users;
    private final ClassEnrollmentRepository enrollments;
    private final ReadingActivityRepository readingActivities;
    private final ReadingQuestionRepository readingQuestions;
    private final ReadingAttemptRepository readingAttempts;
    private final ReadingAnswerRepository readingAnswers;
    private final SpeakingActivityRepository speakingActivities;
    private final SpeakingSubmissionRepository speakingSubmissions;
    private final LessonService lessonService;
    private final ListeningActivityRepository listeningActivities;
    private final ListeningQuestionRepository listeningQuestions;
    private final ListeningAttemptRepository listeningAttempts;
    private final ListeningAnswerRepository listeningAnswers;
    private final GrammarTopicRepository grammarTopics;
    private final GrammarExerciseRepository grammarExercises;
    private final StudentGrammarProgressRepository grammarProgress;

    /** Sau ngần ấy ngày không luyện, chủ đề đã nắm vững được nhắc ôn lại. */
    static final int REVIEW_AFTER_DAYS = 14;

    public ExamPracticeService(
            UserRepository users,
            ClassEnrollmentRepository enrollments,
            ReadingActivityRepository readingActivities,
            ReadingQuestionRepository readingQuestions,
            ReadingAttemptRepository readingAttempts,
            ReadingAnswerRepository readingAnswers,
            SpeakingActivityRepository speakingActivities,
            SpeakingSubmissionRepository speakingSubmissions,
            LessonService lessonService,
            ListeningActivityRepository listeningActivities,
            ListeningQuestionRepository listeningQuestions,
            ListeningAttemptRepository listeningAttempts,
            ListeningAnswerRepository listeningAnswers,
            GrammarTopicRepository grammarTopics,
            GrammarExerciseRepository grammarExercises,
            StudentGrammarProgressRepository grammarProgress) {
        this.users = users;
        this.enrollments = enrollments;
        this.readingActivities = readingActivities;
        this.readingQuestions = readingQuestions;
        this.readingAttempts = readingAttempts;
        this.readingAnswers = readingAnswers;
        this.speakingActivities = speakingActivities;
        this.speakingSubmissions = speakingSubmissions;
        this.lessonService = lessonService;
        this.listeningActivities = listeningActivities;
        this.listeningQuestions = listeningQuestions;
        this.listeningAttempts = listeningAttempts;
        this.listeningAnswers = listeningAnswers;
        this.grammarTopics = grammarTopics;
        this.grammarExercises = grammarExercises;
        this.grammarProgress = grammarProgress;
    }

    @Transactional(readOnly = true)
    public PracticePlan plan(String email) {
        User student =
                users.findByEmailIgnoreCase(email)
                        .filter(user -> user.getRole() == UserRole.STUDENT)
                        .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Không tìm thấy học viên đang hoạt động"));

        Set<Long> courseIds =
                enrollments.findAllByStudentIdAndStatusOrderByJoinedAtDesc(
                                student.getId(), ClassEnrollment.Status.ACTIVE)
                        .stream()
                        .map(enrollment -> enrollment.getClassroom().getCourse().getId())
                        .collect(LinkedHashSet::new, Set::add, Set::addAll);
        if (courseIds.isEmpty()) return new PracticePlan(List.of(), List.of(), List.of(), List.of());

        List<ReadingActivity> availableReading =
                readingActivities
                        .findAllByCourseWeekCourseIdInAndStatusOrderByUpdatedAtDesc(
                                courseIds, ReadingActivity.Status.PUBLISHED)
                        .stream()
                        .filter(activity -> isAccessible(activity, student))
                        .toList();
        List<SpeakingActivity> availableSpeaking =
                speakingActivities
                        .findAllByCourseWeekCourseIdInAndStatusOrderByUpdatedAtDesc(
                                courseIds, SpeakingActivity.Status.PUBLISHED)
                        .stream()
                        .filter(activity -> isAccessible(activity, student))
                        .toList();

        return new PracticePlan(
                readingPlan(student.getId(), courseIds, availableReading),
                speakingPlan(student, courseIds, availableSpeaking),
                listeningPlan(student, courseIds),
                grammarPlan(student, courseIds));
    }

    private List<ListeningSkillPlan> listeningPlan(User student, Set<Long> courseIds) {
        List<ListeningActivity> activities =
                listeningActivities
                        .findAllByCourseWeekCourseIdInAndStatusOrderByUpdatedAtDesc(
                                courseIds, ListeningActivity.Status.PUBLISHED)
                        .stream()
                        .filter(activity -> isAccessible(activity, student))
                        .toList();

        // Mỗi câu chỉ tính câu trả lời gần nhất (lượt chính thức hoặc lượt luyện), nên luyện đúng
        // thì điểm kỹ năng tăng lên và gợi ý tự rút bớt.
        Map<Long, Boolean> latestCorrect = new java.util.HashMap<>();
        Map<Long, ListeningQuestion.SkillType> skillOfQuestion = new java.util.HashMap<>();
        List<elearning.entity.ListeningAttempt> attempts =
                listeningAttempts
                        .findAllByStudentIdAndActivityCourseWeekCourseIdInOrderBySubmittedAtDesc(
                                student.getId(), courseIds)
                        .stream()
                        .filter(attempt -> isVisible(attempt.getActivity()))
                        .toList();
        if (!attempts.isEmpty()) {
            Map<Long, LocalDateTime> submittedAt = new java.util.HashMap<>();
            for (var attempt : attempts) submittedAt.put(attempt.getId(), attempt.getSubmittedAt());
            List<ListeningAnswer> rows =
                    new ArrayList<>(
                            listeningAnswers.findAllByAttemptIdIn(
                                    attempts.stream()
                                            .map(elearning.entity.ListeningAttempt::getId)
                                            .toList()));
            rows.sort(
                    (left, right) -> {
                        int byTime =
                                submittedAt
                                        .get(right.getAttempt().getId())
                                        .compareTo(submittedAt.get(left.getAttempt().getId()));
                        return byTime != 0
                                ? byTime
                                : Long.compare(right.getAttempt().getId(), left.getAttempt().getId());
                    });
            for (ListeningAnswer row : rows) {
                Long questionId = row.getQuestion().getId();
                if (latestCorrect.containsKey(questionId)) continue;
                latestCorrect.put(questionId, row.isCorrect());
                skillOfQuestion.put(questionId, row.getQuestion().getSkillType());
            }
        }
        Map<ListeningQuestion.SkillType, SkillCounts> counts =
                new EnumMap<>(ListeningQuestion.SkillType.class);
        for (ListeningQuestion.SkillType skill : ListeningQuestion.SkillType.values()) {
            counts.put(skill, new SkillCounts());
        }
        latestCorrect.forEach(
                (questionId, ok) -> {
                    SkillCounts c = counts.get(skillOfQuestion.get(questionId));
                    c.total++;
                    if (ok) c.correct++;
                });

        Map<ListeningQuestion.SkillType, List<ListeningPracticeActivity>> sources =
                new EnumMap<>(ListeningQuestion.SkillType.class);
        for (ListeningQuestion.SkillType skill : ListeningQuestion.SkillType.values()) {
            sources.put(skill, new ArrayList<>());
        }
        for (ListeningActivity activity : activities) {
            // Chỉ gợi ý bài đã nộp chính thức: lượt luyện theo kỹ năng chỉ mở sau đó.
            if (!listeningAttempts.existsByActivityIdAndStudentIdAndAssessmentSlot(
                    activity.getId(), student.getId(), 1)) {
                continue;
            }
            Map<ListeningQuestion.SkillType, Integer> perSkill =
                    new EnumMap<>(ListeningQuestion.SkillType.class);
            for (ListeningQuestion q :
                    listeningQuestions.findAllByActivityIdOrderBySortOrderAsc(activity.getId())) {
                perSkill.merge(q.getSkillType(), 1, Integer::sum);
            }
            perSkill.forEach(
                    (skill, n) ->
                            sources.get(skill)
                                    .add(
                                            new ListeningPracticeActivity(
                                                    activity.getId(),
                                                    activity.getTitle(),
                                                    activity.getCourseWeek().getCourse().getTitle(),
                                                    n)));
        }
        List<ListeningSkillPlan> result = new ArrayList<>();
        for (ListeningQuestion.SkillType skill : ListeningQuestion.SkillType.values()) {
            if (sources.get(skill).isEmpty()) continue;
            SkillCounts c = counts.get(skill);
            BigDecimal score =
                    c.total == 0
                            ? null
                            : BigDecimal.valueOf(c.correct * 100.0 / c.total)
                                    .setScale(2, RoundingMode.HALF_UP);
            result.add(
                    new ListeningSkillPlan(
                            skill.name(),
                            listeningSkillLabel(skill),
                            c.correct,
                            c.total,
                            score,
                            c.total > 0,
                            score != null && score.compareTo(PRACTICE_THRESHOLD) < 0,
                            sources.get(skill)));
        }
        result.sort(
                (left, right) -> {
                    if (left.score() == null) return right.score() == null ? 0 : 1;
                    if (right.score() == null) return -1;
                    return left.score().compareTo(right.score());
                });
        return result;
    }

    private List<GrammarTopicPlan> grammarPlan(User student, Set<Long> courseIds) {
        Map<Long, StudentGrammarProgress> progressByTopic = new java.util.HashMap<>();
        for (StudentGrammarProgress p : grammarProgress.findAllByStudentId(student.getId())) {
            progressByTopic.put(p.getGrammarTopic().getId(), p);
        }
        LocalDateTime reviewBefore = LocalDateTime.now().minusDays(REVIEW_AFTER_DAYS);
        List<GrammarTopicPlan> result = new ArrayList<>();
        for (GrammarTopic topic :
                grammarTopics.findAllByCourseWeekCourseIdInAndStatus(
                        courseIds, GrammarTopic.Status.PUBLISHED)) {
            if (!isAccessible(topic, student)) continue;
            int exerciseCount = (int) grammarExercises.countByGrammarTopicId(topic.getId());
            if (exerciseCount == 0) continue;
            StudentGrammarProgress p = progressByTopic.get(topic.getId());
            StudentGrammarProgress.Mastery mastery =
                    p == null ? StudentGrammarProgress.Mastery.NEW : p.getMastery();
            String reason = null;
            if (mastery == StudentGrammarProgress.Mastery.NEW) reason = "NOT_STARTED";
            else if (mastery == StudentGrammarProgress.Mastery.LEARNING) reason = "WEAK";
            else if (p.getLastPracticedAt() != null && p.getLastPracticedAt().isBefore(reviewBefore))
                reason = "REVIEW_DUE";
            result.add(
                    new GrammarTopicPlan(
                            topic.getId(),
                            topic.getTitle(),
                            topic.getCourseWeek().getCourse().getTitle(),
                            topic.getLevel().name(),
                            mastery.name(),
                            p == null ? null : p.getBestScore(),
                            p == null ? null : p.getLastScore(),
                            p == null ? 0 : p.getExerciseAttempts(),
                            topic.getPassScore(),
                            exerciseCount,
                            reason,
                            reason != null));
        }
        // Yếu nhất lên đầu, rồi đến chủ đề chưa làm, rồi chủ đề cần ôn lại, cuối cùng đã vững.
        result.sort(
                java.util.Comparator.comparingInt((GrammarTopicPlan t) -> grammarRank(t.reason()))
                        .thenComparing(
                                t -> t.lastScore() == null ? BigDecimal.valueOf(101) : t.lastScore()));
        return result;
    }

    private static int grammarRank(String reason) {
        if (reason == null) return 3;
        return switch (reason) {
            case "WEAK" -> 0;
            case "NOT_STARTED" -> 1;
            default -> 2;
        };
    }

    private boolean isVisible(ListeningActivity activity) {
        return activity.getStatus() == ListeningActivity.Status.PUBLISHED
                && activity.getCourseWeek() != null
                && activity.getCourseWeek().getStatus() == CourseWeek.Status.PUBLISHED
                && activity.getCourseWeek().getCourse().getStatus() == Course.Status.PUBLISHED
                && (activity.getLesson() == null
                        || activity.getLesson().getStatus() == Lesson.Status.PUBLISHED);
    }

    private boolean isAccessible(ListeningActivity activity, User student) {
        return isVisible(activity)
                && (activity.getLesson() == null
                        || !lessonService.accessState(student, activity.getLesson()).locked());
    }

    private boolean isAccessible(GrammarTopic topic, User student) {
        return topic.getCourseWeek() != null
                && topic.getCourseWeek().getStatus() == CourseWeek.Status.PUBLISHED
                && topic.getCourseWeek().getCourse().getStatus() == Course.Status.PUBLISHED
                && (topic.getLesson() == null
                        || (topic.getLesson().getStatus() == Lesson.Status.PUBLISHED
                                && !lessonService.accessState(student, topic.getLesson()).locked()));
    }

    private String listeningSkillLabel(ListeningQuestion.SkillType skill) {
        return switch (skill) {
            case MAIN_IDEA -> "Nắm ý chính";
            case DETAIL -> "Nghe thông tin chi tiết";
            case PURPOSE -> "Mục đích người nói";
            case INFERENCE -> "Suy luận từ hội thoại";
        };
    }

    private List<ReadingSkillPlan> readingPlan(
            Long studentId, Set<Long> courseIds, List<ReadingActivity> activities) {
        Map<ReadingQuestion.SkillType, SkillCounts> counts =
                new EnumMap<>(ReadingQuestion.SkillType.class);
        for (ReadingQuestion.SkillType skill : ReadingQuestion.SkillType.values()) {
            counts.put(skill, new SkillCounts());
        }

        List<ReadingAttempt> assessedAttempts =
                readingAttempts
                        .findAllByStudentIdAndTypeAndActivityCourseWeekCourseIdInOrderBySubmittedAtDesc(
                                studentId, ReadingAttempt.Type.ASSESSMENT, courseIds)
                        .stream()
                        .filter(attempt -> isVisible(attempt.getActivity()))
                        .toList();
        if (!assessedAttempts.isEmpty()) {
            for (ReadingAnswer answer :
                    readingAnswers.findAllByAttemptIdIn(
                            assessedAttempts.stream().map(ReadingAttempt::getId).toList())) {
                ReadingQuestion.SkillType skill =
                        answer.getQuestion().getSkillType() == null
                                ? ReadingQuestion.SkillType.DETAIL
                                : answer.getQuestion().getSkillType();
                SkillCounts skillCounts = counts.get(skill);
                skillCounts.total++;
                if (answer.isCorrect()) skillCounts.correct++;
            }
        }

        Map<ReadingQuestion.SkillType, List<ReadingPracticeActivity>> sourcesBySkill =
                new EnumMap<>(ReadingQuestion.SkillType.class);
        for (ReadingQuestion.SkillType skill : ReadingQuestion.SkillType.values()) {
            sourcesBySkill.put(skill, new ArrayList<>());
        }
        for (ReadingActivity activity : activities) {
            Map<ReadingQuestion.SkillType, Integer> questionCounts =
                    new EnumMap<>(ReadingQuestion.SkillType.class);
            for (ReadingQuestion question :
                    readingQuestions.findAllByActivityIdOrderBySortOrderAsc(activity.getId())) {
                ReadingQuestion.SkillType skill =
                        question.getSkillType() == null
                                ? ReadingQuestion.SkillType.DETAIL
                                : question.getSkillType();
                questionCounts.merge(skill, 1, Integer::sum);
            }
            for (ReadingQuestion.SkillType skill : ReadingQuestion.SkillType.values()) {
                int questionCount = questionCounts.getOrDefault(skill, 0);
                if (questionCount > 0) {
                    sourcesBySkill
                            .get(skill)
                            .add(
                                    new ReadingPracticeActivity(
                                            activity.getId(),
                                            activity.getTitle(),
                                            activity.getCourseWeek().getCourse().getTitle(),
                                            questionCount));
                }
            }
        }

        List<ReadingSkillPlan> result = new ArrayList<>();
        for (ReadingQuestion.SkillType skill : ReadingQuestion.SkillType.values()) {
            List<ReadingPracticeActivity> sources = sourcesBySkill.get(skill);
            if (sources.isEmpty()) continue;
            SkillCounts skillCounts = counts.get(skill);
            BigDecimal score =
                    skillCounts.total == 0
                            ? null
                            : BigDecimal.valueOf(skillCounts.correct * 100.0 / skillCounts.total)
                                    .setScale(2, RoundingMode.HALF_UP);
            result.add(
                    new ReadingSkillPlan(
                            skill.name(),
                            readingSkillLabel(skill),
                            skillCounts.correct,
                            skillCounts.total,
                            score,
                            skillCounts.total > 0,
                            score != null && score.compareTo(PRACTICE_THRESHOLD) < 0,
                            sources));
        }
        result.sort(
                (left, right) -> {
                    if (left.score() == null) return right.score() == null ? 0 : 1;
                    if (right.score() == null) return -1;
                    return left.score().compareTo(right.score());
                });
        return result;
    }

    private List<SpeakingSkillPlan> speakingPlan(
            User student, Set<Long> courseIds, List<SpeakingActivity> activities) {
        List<SpeakingSubmission> graded =
                speakingSubmissions
                        .findAllByStudentIdAndActivityCourseWeekCourseIdInAndStatusOrderBySubmittedAtDesc(
                                student.getId(), courseIds, SpeakingSubmission.Status.GRADED)
                        .stream()
                        .filter(submission -> isAccessible(submission.getActivity(), student))
                        .toList();

        Map<String, Function<SpeakingSubmission, BigDecimal>> scoreGetters =
                Map.of(
                        "TASK_COMPLETION", SpeakingSubmission::getTaskCompletionScore,
                        "FLUENCY", SpeakingSubmission::getFluencyScore,
                        "PRONUNCIATION", SpeakingSubmission::getPronunciationScore,
                        "VOCABULARY_GRAMMAR", SpeakingSubmission::getVocabularyGrammarScore);
        Map<String, String> labels =
                Map.of(
                        "TASK_COMPLETION", "Hoàn thành yêu cầu",
                        "FLUENCY", "Độ lưu loát",
                        "PRONUNCIATION", "Phát âm",
                        "VOCABULARY_GRAMMAR", "Từ vựng & ngữ pháp");
        List<SpeakingPracticeActivity> practiceActivities =
                activities.stream()
                        .map(
                                activity ->
                                        new SpeakingPracticeActivity(
                                                activity.getId(),
                                                activity.getTitle(),
                                                activity.getCourseWeek().getCourse().getTitle(),
                                                activity.getInstruction(),
                                                activity.getPromptText()))
                        .toList();

        List<SpeakingSkillPlan> result = new ArrayList<>();
        for (String criterion :
                List.of("TASK_COMPLETION", "FLUENCY", "PRONUNCIATION", "VOCABULARY_GRAMMAR")) {
            List<BigDecimal> values =
                    graded.stream()
                            .map(scoreGetters.get(criterion))
                            .filter(java.util.Objects::nonNull)
                            .toList();
            BigDecimal average =
                    values.isEmpty()
                            ? null
                            : values.stream()
                                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .divide(
                                            BigDecimal.valueOf(values.size()),
                                            2,
                                            RoundingMode.HALF_UP);
            result.add(
                    new SpeakingSkillPlan(
                            criterion,
                            labels.get(criterion),
                            average,
                            values.size(),
                            average != null && average.compareTo(PRACTICE_THRESHOLD) < 0,
                            practiceActivities));
        }
        result.sort(
                (left, right) -> {
                    if (left.averageScore() == null) return right.averageScore() == null ? 0 : 1;
                    if (right.averageScore() == null) return -1;
                    return left.averageScore().compareTo(right.averageScore());
                });
        return result;
    }

    private boolean isVisible(ReadingActivity activity) {
        return activity.getStatus() == ReadingActivity.Status.PUBLISHED
                && activity.getCourseWeek() != null
                && activity.getCourseWeek().getStatus() == CourseWeek.Status.PUBLISHED
                && activity.getCourseWeek().getCourse().getStatus() == Course.Status.PUBLISHED
                && (activity.getLesson() == null
                        || activity.getLesson().getStatus() == Lesson.Status.PUBLISHED);
    }

    private boolean isVisible(SpeakingActivity activity) {
        return activity.getStatus() == SpeakingActivity.Status.PUBLISHED
                && activity.getCourseWeek() != null
                && activity.getCourseWeek().getStatus() == CourseWeek.Status.PUBLISHED
                && activity.getCourseWeek().getCourse().getStatus() == Course.Status.PUBLISHED
                && (activity.getLesson() == null
                        || activity.getLesson().getStatus() == Lesson.Status.PUBLISHED);
    }

    private boolean isAccessible(ReadingActivity activity, User student) {
        return isVisible(activity)
                && (activity.getLesson() == null
                        || !lessonService.accessState(student, activity.getLesson()).locked());
    }

    private boolean isAccessible(SpeakingActivity activity, User student) {
        return isVisible(activity)
                && (activity.getLesson() == null
                        || !lessonService.accessState(student, activity.getLesson()).locked());
    }

    private String readingSkillLabel(ReadingQuestion.SkillType skill) {
        return switch (skill) {
            case DETAIL -> "Tìm thông tin chi tiết";
            case INFERENCE -> "Suy luận từ ngữ cảnh";
            case VOCABULARY -> "Từ vựng trong ngữ cảnh";
            case PURPOSE -> "Mục đích / ý chính";
        };
    }

    private static final class SkillCounts {
        private int correct;
        private int total;
    }
}
