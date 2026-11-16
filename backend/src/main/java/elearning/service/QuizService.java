package elearning.service;

import elearning.dto.AssessmentDto.QuizRequest;
import elearning.dto.AssessmentDto.QuizResponse;
import elearning.dto.AssessmentDto.QuizSummaryResponse;
import elearning.dto.AssessmentDto.StudentQuizResponse;
import elearning.entity.Course;
import elearning.entity.Lesson;
import elearning.entity.ClassEnrollment;
import elearning.entity.Question;
import elearning.entity.Quiz;
import elearning.entity.QuizQuestion;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.CourseRepository;
import elearning.repository.LessonRepository;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.QuestionRepository;
import elearning.repository.QuizQuestionRepository;
import elearning.repository.QuizAttemptRepository;
import elearning.repository.QuizRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class QuizService {
    private final QuizRepository quizzes;
    private final QuizAttemptRepository attempts;
    private final QuizQuestionRepository links;
    private final QuestionRepository questions;
    private final CourseRepository courses;
    private final QuestionService questionService;
    private final UserRepository users;
    private final ClassEnrollmentRepository enrollments;
    private final LessonService lessonService;
    private final LessonRepository lessons;

    public QuizService(
            QuizRepository q,
            QuizAttemptRepository a,
            QuizQuestionRepository l,
            QuestionRepository qr,
            CourseRepository c,
            QuestionService qs,
            UserRepository u,
            ClassEnrollmentRepository e,
            LessonService lessonService,
            LessonRepository lessons) {
        quizzes = q;
        attempts = a;
        links = l;
        questions = qr;
        courses = c;
        questionService = qs;
        users = u;
        enrollments = e;
        this.lessonService = lessonService;
        this.lessons = lessons;
    }

    public QuizResponse create(String email, QuizRequest r) {
        User owner = contentUser(email);
        Quiz q = new Quiz();
        q.setCreatedBy(owner);
        apply(q, r, owner);
        quizzes.save(q);
        sync(q, r.questionIds(), owner);
        return response(q);
    }

    public QuizResponse update(String email, Long id, QuizRequest r) {
        User user = contentUser(email);
        Quiz q = manageable(id, user);
        if (attempts.existsByQuizId(id)) {
            throw new IllegalArgumentException(
                    "Bài kiểm tra đã có lượt làm nên không thể sửa nội dung. Hãy tạo bài kiểm tra mới để bảo toàn kết quả cũ.");
        }
        apply(q, r, user);
        sync(q, r.questionIds(), user);
        quizzes.save(q);
        return response(q);
    }

    public void delete(String email, Long id) {
        Quiz quiz = manageable(id, contentUser(email));
        if (attempts.existsByQuizId(id)) {
            throw new IllegalArgumentException(
                    "Bài kiểm tra đã có lượt làm nên không thể xóa. Hãy giữ bài để bảo toàn lịch sử kết quả.");
        }
        quizzes.delete(quiz);
    }

    @Transactional(readOnly = true)
    public List<QuizSummaryResponse> teacherList(String email) {
        User u = contentUser(email);
        List<Quiz> data =
                u.getRole() == UserRole.ADMIN
                        ? quizzes.findAll()
                        : quizzes.findAllByCreatedByIdOrderByUpdatedAtDesc(u.getId());
        return data.stream().map(this::summary).toList();
    }

    @Transactional(readOnly = true)
    public QuizResponse teacherGet(String email, Long id) {
        return response(manageable(id, contentUser(email)));
    }

    @Transactional(readOnly = true)
    public List<QuizSummaryResponse> published(String email) {
        User student = student(email);
        return quizzes.findAllByStatusOrderByCreatedAtDesc(Quiz.Status.PUBLISHED).stream()
                .filter(quiz -> canStudentAccess(student, quiz))
                .map(this::summary)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentQuizResponse studentGet(String email, Long id) {
        User student = student(email);
        Quiz quiz = publishedQuiz(id);
        requireStudentAccess(student, quiz);
        return studentResponse(quiz, student);
    }

    Quiz publishedQuiz(Long id) {
        return quizzes.findByIdAndStatus(id, Quiz.Status.PUBLISHED)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy bài kiểm tra"));
    }

    List<QuizQuestion> quizQuestions(Long id) {
        return links.findAllByQuizIdOrderBySortOrderAsc(id);
    }

    StudentQuizResponse studentResponse(Quiz q) {
        return studentResponse(q, null);
    }

    StudentQuizResponse studentResponse(Quiz q, User student) {
        Long inProgress = null, last = null;
        java.math.BigDecimal best = null;
        if (student != null) {
            var current =
                    attempts.findTopByQuizIdAndStudentIdAndStatusOrderByStartTimeDesc(
                            q.getId(), student.getId(), elearning.entity.QuizAttempt.Status.IN_PROGRESS);
            if (current.isPresent()
                    && java.time.LocalDateTime.now()
                            .isBefore(current.get().getStartTime().plusMinutes(q.getTimeLimitMinutes())))
                inProgress = current.get().getId();
            var finished =
                    attempts.findAllByQuizIdAndStudentIdAndStatusNotOrderByStartTimeDesc(
                            q.getId(), student.getId(), elearning.entity.QuizAttempt.Status.IN_PROGRESS);
            if (!finished.isEmpty()) last = finished.get(0).getId();
            best =
                    finished.stream()
                            .map(elearning.entity.QuizAttempt::getScore)
                            .filter(Objects::nonNull)
                            .max(java.math.BigDecimal::compareTo)
                            .orElse(null);
        }
        return new StudentQuizResponse(
                q.getId(),
                q.getTitle(),
                q.getDescription(),
                q.getCourse() == null ? null : q.getCourse().getId(),
                q.getCourse() == null ? null : q.getCourse().getTitle(),
                weekId(q),
                q.getLesson() == null ? null : q.getLesson().getId(),
                q.getLesson() == null ? null : q.getLesson().getTitle(),
                q.getTimeLimitMinutes(),
                q.getTotalQuestion(),
                quizQuestions(q.getId()).stream()
                        .map(x -> questionService.studentResponse(x.getQuestion()))
                        .toList(),
                inProgress,
                last,
                best);
    }

    private QuizResponse response(Quiz q) {
        return new QuizResponse(
                q.getId(),
                q.getTitle(),
                q.getDescription(),
                q.getCourse() == null ? null : q.getCourse().getId(),
                q.getCourse() == null ? null : q.getCourse().getTitle(),
                weekId(q),
                q.getLesson() == null ? null : q.getLesson().getId(),
                q.getLesson() == null ? null : q.getLesson().getTitle(),
                q.getTimeLimitMinutes(),
                q.getTotalQuestion(),
                q.getStatus().name(),
                quizQuestions(q.getId()).stream()
                        .map(x -> questionService.response(x.getQuestion()))
                        .toList(),
                q.getCreatedAt(),
                q.getUpdatedAt(),
                q.getId() != null && attempts.existsByQuizId(q.getId()));
    }

    private QuizSummaryResponse summary(Quiz q) {
        return new QuizSummaryResponse(
                q.getId(),
                q.getTitle(),
                q.getDescription(),
                q.getCourse() == null ? null : q.getCourse().getId(),
                q.getCourse() == null ? null : q.getCourse().getTitle(),
                weekId(q),
                q.getLesson() == null ? null : q.getLesson().getId(),
                q.getLesson() == null ? null : q.getLesson().getTitle(),
                q.getTimeLimitMinutes(),
                q.getTotalQuestion(),
                q.getStatus().name(),
                q.getUpdatedAt(),
                q.getId() != null && attempts.existsByQuizId(q.getId()));
    }

    private void apply(Quiz q, QuizRequest r, User owner) {
        q.setTitle(r.title().trim());
        q.setDescription(clean(r.description()));
        q.setTimeLimitMinutes(r.timeLimitMinutes());
        // Ẩn/hiện chỉ còn ở khóa học và tuần; bài và học liệu luôn hiển thị.
        q.setStatus(Quiz.Status.PUBLISHED);
        if (r.lessonId() != null) {
            // Quiz thuộc một bài học: khóa học được suy ra từ bài, không nhận courseId lệch.
            Lesson lesson =
                    lessons.findById(r.lessonId())
                            .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy bài học"));
            if (lesson.getCourseWeek() == null) {
                throw new IllegalArgumentException("Bài học chưa được gắn vào tuần học");
            }
            Course lessonCourse = lesson.getCourseWeek().getCourse();
            if (owner.getRole() != UserRole.ADMIN
                    && !lessonCourse.getCreatedByTeacher().getId().equals(owner.getId())) {
                throw new IllegalArgumentException("Bài học không thuộc giáo viên hiện tại");
            }
            if (r.courseId() != null && !r.courseId().equals(lessonCourse.getId())) {
                throw new IllegalArgumentException("Bài học không thuộc khóa học đã chọn");
            }
            q.setLesson(lesson);
            q.setCourse(lessonCourse);
            return;
        }
        q.setLesson(null);
        if (r.courseId() == null) {
            q.setCourse(null);
            return;
        }
        Course course =
                courses.findById(r.courseId())
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy khóa học"));
        if (owner.getRole() != UserRole.ADMIN
                && !course.getCreatedByTeacher().getId().equals(owner.getId()))
            throw new IllegalArgumentException("Khóa học không thuộc giáo viên hiện tại");
        q.setCourse(course);
    }

    private void sync(Quiz quiz, List<Long> ids, User owner) {
        List<Question> selected = questions.findAllById(ids);
        if (selected.size() != ids.size())
            throw new ContentNotFoundException("Có câu hỏi không tồn tại");
        if (owner.getRole() != UserRole.ADMIN
                && selected.stream().anyMatch(q -> !q.getCreatedBy().getId().equals(owner.getId())))
            throw new IllegalArgumentException("Chỉ được chọn câu hỏi do bạn tạo");
        Map<Long, Question> map = new HashMap<>();
        selected.forEach(q -> map.put(q.getId(), q));
        links.deleteAllByQuizId(quiz.getId());
        links.flush();
        int order = 1;
        for (Long id : ids) {
            QuizQuestion link = new QuizQuestion();
            link.setQuiz(quiz);
            link.setQuestion(map.get(id));
            link.setSortOrder(order++);
            links.save(link);
        }
        quiz.setTotalQuestion(ids.size());
    }

    private Quiz manageable(Long id, User user) {
        return (user.getRole() == UserRole.ADMIN
                        ? quizzes.findById(id)
                        : quizzes.findByIdAndCreatedById(id, user.getId()))
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy bài kiểm tra"));
    }

    boolean canStudentAccess(User student, Quiz quiz) {
        try {
            requireStudentAccess(student, quiz);
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    void requireStudentAccess(User student, Quiz quiz) {
        if (quiz.getCourse() != null) {
            if (quiz.getCourse().getStatus() != Course.Status.PUBLISHED) {
                throw new ContentNotFoundException("Khóa học của bài kiểm tra chưa được xuất bản");
            }
            if (!enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                    student.getId(), quiz.getCourse().getId(), ClassEnrollment.Status.ACTIVE)) {
                throw elearning.exception.LearningAccessException.notEnrolled(
                        "Bạn cần tham gia một lớp của khóa học trước khi làm bài kiểm tra",
                        quiz.getCourse().getId());
            }
        }

        if (quiz.getLesson() != null) {
            lessonService.requireStudentAccess(student, quiz.getLesson());
        }

        // Quizzes may also reference lessons through their questions. Reuse the lesson
        // visibility/unlock rules so quizzes from draft or locked weeks cannot bypass curriculum.
        Map<Long, elearning.entity.Lesson> linkedLessons = new LinkedHashMap<>();
        for (QuizQuestion link : quizQuestions(quiz.getId())) {
            if (link.getQuestion().getLesson() != null) {
                linkedLessons.putIfAbsent(
                        link.getQuestion().getLesson().getId(), link.getQuestion().getLesson());
            }
        }
        for (elearning.entity.Lesson lesson : linkedLessons.values()) {
            lessonService.requireStudentAccess(student, lesson);
        }
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));
    }

    private User contentUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        u ->
                                u.getStatus() == UserStatus.ACTIVE
                                        && (u.getRole() == UserRole.TEACHER
                                                || u.getRole() == UserRole.ADMIN))
                .orElseThrow(
                        () ->
                                new ContentNotFoundException(
                                        "Không tìm thấy người quản lý nội dung"));
    }

    private Long weekId(Quiz q) {
        return q.getLesson() == null || q.getLesson().getCourseWeek() == null
                ? null
                : q.getLesson().getCourseWeek().getId();
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
