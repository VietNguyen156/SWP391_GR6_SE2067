package elearning.service;

import elearning.dto.InsightDto.ListeningGrammarInsights;
import elearning.dto.InsightDto.SkillStat;
import elearning.entity.Course;
import elearning.entity.GrammarTopic;
import elearning.entity.ListeningAttempt;
import elearning.entity.ListeningQuestion;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.CourseRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.ListeningAnswerRepository;
import elearning.repository.ListeningAttemptRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Thống kê điểm yếu Listening (theo kỹ năng) và Grammar (theo chủ đề) cho giáo viên. */
@Service
@Transactional(readOnly = true)
public class TeacherInsightService {
    private final UserRepository users;
    private final CourseRepository courses;
    private final ListeningAttemptRepository listeningAttempts;
    private final ListeningAnswerRepository listeningAnswers;
    private final GrammarTopicRepository grammarTopics;
    private final GrammarExerciseService grammarExercises;

    public TeacherInsightService(
            UserRepository users,
            CourseRepository courses,
            ListeningAttemptRepository listeningAttempts,
            ListeningAnswerRepository listeningAnswers,
            GrammarTopicRepository grammarTopics,
            GrammarExerciseService grammarExercises) {
        this.users = users;
        this.courses = courses;
        this.listeningAttempts = listeningAttempts;
        this.listeningAnswers = listeningAnswers;
        this.grammarTopics = grammarTopics;
        this.grammarExercises = grammarExercises;
    }

    public ListeningGrammarInsights insights(String email) {
        User user =
                users.findByEmailIgnoreCase(email)
                        .filter(u -> u.getRole() == UserRole.TEACHER || u.getRole() == UserRole.ADMIN)
                        .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy giáo viên"));
        List<Course> owned =
                user.getRole() == UserRole.ADMIN
                        ? courses.findAll()
                        : courses.findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(user.getId());
        List<Long> courseIds = owned.stream().map(Course::getId).toList();
        if (courseIds.isEmpty()) return new ListeningGrammarInsights(List.of(), 0, List.of());

        // Chỉ tính lượt chính thức để mỗi học viên đóng góp một lần cho mỗi câu.
        List<ListeningAttempt> attempts =
                listeningAttempts.findAllByTypeAndActivityCourseWeekCourseIdIn(
                        ListeningAttempt.Type.ASSESSMENT, courseIds);
        Map<ListeningQuestion.SkillType, int[]> counts = new EnumMap<>(ListeningQuestion.SkillType.class);
        if (!attempts.isEmpty()) {
            for (var answer :
                    listeningAnswers.findAllByAttemptIdIn(
                            attempts.stream().map(ListeningAttempt::getId).toList())) {
                int[] c =
                        counts.computeIfAbsent(
                                answer.getQuestion().getSkillType(), k -> new int[2]);
                c[1]++;
                if (answer.isCorrect()) c[0]++;
            }
        }
        List<SkillStat> skills = new ArrayList<>();
        counts.forEach(
                (skill, c) ->
                        skills.add(
                                new SkillStat(
                                        skill.name(),
                                        label(skill),
                                        c[0],
                                        c[1],
                                        BigDecimal.valueOf(c[0] * 100.0 / c[1])
                                                .setScale(2, RoundingMode.HALF_UP))));
        skills.sort(Comparator.comparing(SkillStat::score));

        List<GrammarTopic> ownedTopics =
                user.getRole() == UserRole.ADMIN
                        ? grammarTopics.findAll()
                        : grammarTopics.findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(user.getId());
        var weak =
                grammarExercises.statsForTopics(ownedTopics).stream()
                        .sorted(Comparator.comparing(s -> s.averageScore()))
                        .limit(5)
                        .toList();
        return new ListeningGrammarInsights(skills, attempts.size(), weak);
    }

    private static String label(ListeningQuestion.SkillType skill) {
        return switch (skill) {
            case MAIN_IDEA -> "Nắm ý chính";
            case DETAIL -> "Nghe thông tin chi tiết";
            case PURPOSE -> "Mục đích người nói";
            case INFERENCE -> "Suy luận từ hội thoại";
        };
    }
}
