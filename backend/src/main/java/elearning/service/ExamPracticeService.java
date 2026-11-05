package elearning.service;

import elearning.dto.ExamPracticeDto.PracticePlan;
import elearning.dto.ExamPracticeDto.ReadingPracticeActivity;
import elearning.dto.ExamPracticeDto.ReadingSkillPlan;
import elearning.dto.ExamPracticeDto.SpeakingPracticeActivity;
import elearning.dto.ExamPracticeDto.SpeakingSkillPlan;
import elearning.entity.ClassEnrollment;
import elearning.entity.Course;
import elearning.entity.CourseWeek;
import elearning.entity.Lesson;
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
import elearning.repository.ReadingActivityRepository;
import elearning.repository.ReadingAnswerRepository;
import elearning.repository.ReadingAttemptRepository;
import elearning.repository.ReadingQuestionRepository;
import elearning.repository.SpeakingActivityRepository;
import elearning.repository.SpeakingSubmissionRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    public ExamPracticeService(
            UserRepository users,
            ClassEnrollmentRepository enrollments,
            ReadingActivityRepository readingActivities,
            ReadingQuestionRepository readingQuestions,
            ReadingAttemptRepository readingAttempts,
            ReadingAnswerRepository readingAnswers,
            SpeakingActivityRepository speakingActivities,
            SpeakingSubmissionRepository speakingSubmissions,
            LessonService lessonService) {
        this.users = users;
        this.enrollments = enrollments;
        this.readingActivities = readingActivities;
        this.readingQuestions = readingQuestions;
        this.readingAttempts = readingAttempts;
        this.readingAnswers = readingAnswers;
        this.speakingActivities = speakingActivities;
        this.speakingSubmissions = speakingSubmissions;
        this.lessonService = lessonService;
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
        if (courseIds.isEmpty()) return new PracticePlan(List.of(), List.of());

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
                speakingPlan(student, courseIds, availableSpeaking));
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
