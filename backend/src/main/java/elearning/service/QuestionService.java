package elearning.service;

import elearning.dto.AssessmentDto.AnswerOptionRequest;
import elearning.dto.AssessmentDto.AnswerOptionResponse;
import elearning.dto.AssessmentDto.QuestionRequest;
import elearning.dto.AssessmentDto.QuestionResponse;
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
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate db;

    private final FinalTestService finalTests;

    public QuestionService(
            QuestionRepository q,
            AnswerOptionRepository o,
            LessonRepository l,
            UserRepository u,
            JdbcTemplate db,
            FinalTestService finalTests) {
        this.finalTests = finalTests;
        questions = q;
        options = o;
        lessons = l;
        users = u;
        this.db = db;
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
        apply(q, r, user);
        questions.save(q);
        syncOptions(q, r.options());
        questions.flush();
        finalTests.refreshForQuestion(q.getId());
        return response(q);
    }

    public void delete(String email, Long id) {
        User user = contentUser(email);
        Question q = manageable(id, user);
        if (db.queryForObject("SELECT COUNT(*) FROM test_sections WHERE source_question_id=?", Integer.class, id) > 0) throw new IllegalArgumentException("Câu hỏi đang được dùng trong Test cuối khóa. Hãy tạo câu hỏi khác.");
        if (db.queryForObject("SELECT COUNT(*) FROM test_bank_question_set_items WHERE question_id=?", Integer.class, id) > 0)
            throw new IllegalArgumentException("Câu hỏi đang nằm trong một bộ đề. Hãy gỡ khỏi bộ đề trước khi xóa.");
        questions.delete(q);
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
                q.getId() != null
                        && (db.queryForObject("SELECT COUNT(*) FROM test_sections WHERE source_question_id=?", Integer.class, q.getId()) > 0
                                || db.queryForObject("SELECT COUNT(*) FROM test_bank_question_set_items WHERE question_id=?", Integer.class, q.getId()) > 0));
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
