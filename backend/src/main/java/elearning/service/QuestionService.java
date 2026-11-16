package elearning.service;

import elearning.dto.AssessmentDto.AnswerOptionRequest;
import elearning.dto.AssessmentDto.AnswerOptionResponse;
import elearning.dto.AssessmentDto.QuestionRequest;
import elearning.dto.AssessmentDto.QuestionResponse;
import elearning.dto.AssessmentDto.StudentOptionResponse;
import elearning.dto.AssessmentDto.StudentQuestionResponse;
import elearning.entity.AnswerOption;
import elearning.entity.Lesson;
import elearning.entity.Question;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.AnswerOptionRepository;
import elearning.repository.LessonRepository;
import elearning.repository.QuestionRepository;
import elearning.repository.QuizAttemptRepository;
import elearning.repository.QuizQuestionRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuestionService {
    private final QuestionRepository questions;
    private final AnswerOptionRepository options;
    private final LessonRepository lessons;
    private final UserRepository users;
    private final QuizQuestionRepository quizLinks;
    private final QuizAttemptRepository attempts;

    public QuestionService(
            QuestionRepository q,
            AnswerOptionRepository o,
            LessonRepository l,
            UserRepository u,
            QuizQuestionRepository quizLinks,
            QuizAttemptRepository attempts) {
        questions = q;
        options = o;
        lessons = l;
        users = u;
        this.quizLinks = quizLinks;
        this.attempts = attempts;
    }

    public QuestionResponse create(String email, QuestionRequest r) {
        User owner = contentUser(email);
        Question q = new Question();
        q.setCreatedBy(owner);
        apply(q, r, owner);
        questions.save(q);
        syncOptions(q, r.options());
        return response(q);
    }

    public QuestionResponse update(String email, Long id, QuestionRequest r) {
        User user = contentUser(email);
        Question q = manageable(id, user);
        if (usedByAttemptedQuiz(id)) {
            throw new IllegalArgumentException(
                    "Câu hỏi thuộc quiz đã có học viên làm nên không thể sửa (kết quả cũ sẽ bị sai). Hãy tạo câu hỏi mới.");
        }
        apply(q, r, user);
        questions.save(q);
        syncOptions(q, r.options());
        return response(q);
    }

    public void delete(String email, Long id) {
        User user = contentUser(email);
        Question q = manageable(id, user);
        List<String> usedIn =
                quizLinks.findAllByQuestionId(id).stream()
                        .map(link -> "“" + link.getQuiz().getTitle() + "”")
                        .distinct()
                        .toList();
        if (!usedIn.isEmpty()) {
            throw new IllegalArgumentException(
                    "Câu hỏi đang được dùng trong quiz "
                            + String.join(", ", usedIn)
                            + ". Hãy bỏ câu hỏi khỏi quiz trước khi xóa.");
        }
        questions.delete(q);
    }

    private boolean usedByAttemptedQuiz(Long questionId) {
        List<Long> quizIds =
                quizLinks.findAllByQuestionId(questionId).stream()
                        .map(link -> link.getQuiz().getId())
                        .distinct()
                        .toList();
        return !quizIds.isEmpty() && attempts.existsByQuizIdIn(quizIds);
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> list(String email) {
        User user = contentUser(email);
        List<Question> data =
                user.getRole() == UserRole.ADMIN
                        ? questions.findAll()
                        : questions.findAllByCreatedByIdOrderByUpdatedAtDesc(user.getId());
        return data.stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public QuestionResponse get(String email, Long id) {
        return response(manageable(id, contentUser(email)));
    }

    Question manageable(Long id, User user) {
        return (user.getRole() == UserRole.ADMIN
                        ? questions.findById(id)
                        : questions.findByIdAndCreatedById(id, user.getId()))
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy câu hỏi"));
    }

    User contentUser(String email) {
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

    public QuestionResponse response(Question q) {
        return new QuestionResponse(
                q.getId(),
                q.getLesson() == null ? null : q.getLesson().getId(),
                q.getQuestionText(),
                q.getExplanation(),
                q.getDifficulty().name(),
                options.findAllByQuestionIdOrderBySortOrderAsc(q.getId()).stream()
                        .map(this::optionResponse)
                        .toList(),
                q.getCreatedAt(),
                q.getUpdatedAt(),
                q.getId() != null && usedByAttemptedQuiz(q.getId()));
    }

    public StudentQuestionResponse studentResponse(Question q) {
        return new StudentQuestionResponse(
                q.getId(),
                q.getQuestionText(),
                q.getDifficulty().name(),
                options.findAllByQuestionIdOrderBySortOrderAsc(q.getId()).stream()
                        .map(
                                o ->
                                        new StudentOptionResponse(
                                                o.getId(), o.getContent(), o.getSortOrder()))
                        .toList());
    }

    private AnswerOptionResponse optionResponse(AnswerOption o) {
        return new AnswerOptionResponse(o.getId(), o.getContent(), o.isCorrect(), o.getSortOrder());
    }

    private void apply(Question q, QuestionRequest r, User owner) {
        q.setQuestionText(r.questionText().trim());
        q.setExplanation(clean(r.explanation()));
        q.setDifficulty(r.difficulty());
        if (r.lessonId() == null) {
            q.setLesson(null);
            return;
        }
        Lesson lesson =
                lessons.findById(r.lessonId())
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy bài học"));
        if (owner.getRole() != UserRole.ADMIN
                && !lesson.getCreatedByTeacher().getId().equals(owner.getId()))
            throw new IllegalArgumentException("Bài học không thuộc giáo viên hiện tại");
        q.setLesson(lesson);
    }

    private void syncOptions(Question q, List<AnswerOptionRequest> requested) {
        List<AnswerOption> existing = options.findAllByQuestionIdOrderBySortOrderAsc(q.getId());
        Map<Long, AnswerOption> byId =
                existing.stream()
                        .collect(Collectors.toMap(AnswerOption::getId, Function.identity()));
        if (!existing.isEmpty()) {
            int temporary = 1000;
            for (AnswerOption o : existing) o.setSortOrder(temporary++);
            options.saveAllAndFlush(existing);
        }
        Set<Long> kept = new HashSet<>();
        int order = 1;
        for (AnswerOptionRequest r : requested) {
            AnswerOption o;
            if (r.id() == null) o = new AnswerOption();
            else {
                o = byId.get(r.id());
                if (o == null) throw new IllegalArgumentException("Đáp án không thuộc câu hỏi");
                kept.add(o.getId());
            }
            o.setQuestion(q);
            o.setContent(r.content().trim());
            o.setCorrect(r.correct());
            o.setSortOrder(order++);
            options.save(o);
        }
        List<AnswerOption> removed =
                existing.stream().filter(o -> !kept.contains(o.getId())).toList();
        if (!removed.isEmpty()) options.deleteAll(removed);
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
