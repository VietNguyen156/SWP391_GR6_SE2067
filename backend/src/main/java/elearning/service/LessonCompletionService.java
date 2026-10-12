package elearning.service;

import elearning.dto.CourseDto.CompletionRequirement;
import elearning.entity.Lesson;
import elearning.entity.ListeningActivity;
import elearning.entity.Quiz;
import elearning.entity.QuizAttempt;
import elearning.entity.SpeakingActivity;
import elearning.entity.User;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.ListeningAttemptRepository;
import elearning.repository.QuizAttemptRepository;
import elearning.repository.QuizRepository;
import elearning.repository.SpeakingActivityRepository;
import elearning.repository.SpeakingSubmissionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Điều kiện hoàn thành bài học — nguồn sự thật duy nhất cho backend và giao diện.
 *
 * <p>Học viên phải <b>nộp</b> mọi Quiz, Listening, Speaking đang hiển thị của bài (không xét
 * điểm). Bài giảng, Ngữ pháp, Flashcards không bắt buộc.
 */
@Service
@Transactional(readOnly = true)
public class LessonCompletionService {
    private final QuizRepository quizzes;
    private final QuizAttemptRepository quizAttempts;
    private final ListeningActivityRepository listening;
    private final ListeningAttemptRepository listeningAttempts;
    private final SpeakingActivityRepository speaking;
    private final SpeakingSubmissionRepository speakingSubmissions;

    public LessonCompletionService(
            QuizRepository quizzes,
            QuizAttemptRepository quizAttempts,
            ListeningActivityRepository listening,
            ListeningAttemptRepository listeningAttempts,
            SpeakingActivityRepository speaking,
            SpeakingSubmissionRepository speakingSubmissions) {
        this.quizzes = quizzes;
        this.quizAttempts = quizAttempts;
        this.listening = listening;
        this.listeningAttempts = listeningAttempts;
        this.speaking = speaking;
        this.speakingSubmissions = speakingSubmissions;
    }

    public List<CompletionRequirement> requirements(Lesson lesson, User student) {
        Long lessonId = lesson.getId();
        List<CompletionRequirement> result = new ArrayList<>();
        for (Quiz quiz : quizzes.findAllByLessonIdOrderByCreatedAtAsc(lessonId)) {
            if (quiz.getStatus() != Quiz.Status.PUBLISHED) continue;
            boolean done =
                    !quizAttempts
                            .findAllByQuizIdAndStudentIdAndStatusNotOrderByStartTimeDesc(
                                    quiz.getId(), student.getId(), QuizAttempt.Status.IN_PROGRESS)
                            .isEmpty();
            result.add(new CompletionRequirement("QUIZ", quiz.getId(), quiz.getTitle(), done));
        }
        for (ListeningActivity activity : listening.findAllByLessonIdOrderByCreatedAtAsc(lessonId)) {
            if (activity.getStatus() != ListeningActivity.Status.PUBLISHED) continue;
            boolean done =
                    listeningAttempts.existsByActivityIdAndStudentId(
                            activity.getId(), student.getId());
            result.add(
                    new CompletionRequirement(
                            "LISTENING", activity.getId(), activity.getTitle(), done));
        }
        for (SpeakingActivity activity : speaking.findAllByLessonIdOrderByCreatedAtAsc(lessonId)) {
            if (activity.getStatus() != SpeakingActivity.Status.PUBLISHED) continue;
            boolean done =
                    speakingSubmissions
                            .findByActivityIdAndStudentId(activity.getId(), student.getId())
                            .isPresent();
            result.add(
                    new CompletionRequirement(
                            "SPEAKING", activity.getId(), activity.getTitle(), done));
        }
        return result;
    }

    public static boolean isComplete(List<CompletionRequirement> requirements) {
        return requirements.stream().allMatch(CompletionRequirement::done);
    }

    /** Phần trăm học liệu bắt buộc đã nộp (0 khi bài không có học liệu bắt buộc). */
    public static BigDecimal percentDone(List<CompletionRequirement> requirements) {
        if (requirements.isEmpty()) return BigDecimal.ZERO;
        long done = requirements.stream().filter(CompletionRequirement::done).count();
        return BigDecimal.valueOf(done * 100.0 / requirements.size())
                .setScale(2, RoundingMode.HALF_UP);
    }

    /** Thông điệp tiếng Việt liệt kê học liệu chưa nộp; null khi đã đủ. */
    public static String missingMessage(List<CompletionRequirement> requirements) {
        List<CompletionRequirement> missing =
                requirements.stream().filter(requirement -> !requirement.done()).toList();
        if (missing.isEmpty()) return null;
        return "Chưa thể hoàn thành bài. Bạn cần nộp: "
                + missing.stream()
                        .map(item -> label(item.type()) + " “" + item.title() + "”")
                        .collect(Collectors.joining(", "))
                + ".";
    }

    private static String label(String type) {
        return switch (type) {
            case "QUIZ" -> "Quiz";
            case "LISTENING" -> "Listening";
            case "SPEAKING" -> "Speaking";
            default -> type;
        };
    }
}
