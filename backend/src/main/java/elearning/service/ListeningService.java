package elearning.service;

import elearning.dto.ListeningDto.ListeningRequest;
import elearning.dto.ListeningDto.ListeningResponse;
import elearning.entity.ListeningActivity;
import elearning.entity.ListeningOption;
import elearning.entity.ListeningQuestion;
import elearning.entity.Lesson;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.CourseWeekRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.ListeningAttemptRepository;
import elearning.repository.ListeningOptionRepository;
import elearning.repository.ListeningQuestionRepository;
import elearning.repository.LessonRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class ListeningService {
    private final ListeningActivityRepository activities;
    private final ListeningAttemptRepository attempts;
    private final ListeningQuestionRepository questions;
    private final ListeningOptionRepository options;
    private final CourseWeekRepository weeks;
    private final UserRepository users;
    private final LessonRepository lessons;

    public ListeningService(
            ListeningActivityRepository a,
            ListeningAttemptRepository at,
            ListeningQuestionRepository q,
            ListeningOptionRepository o,
            CourseWeekRepository w,
            UserRepository u,
            LessonRepository l) {
        activities = a;
        attempts = at;
        questions = q;
        options = o;
        weeks = w;
        users = u;
        lessons = l;
    }

    @Transactional(readOnly = true)
    public List<ListeningResponse> list(String email) {
        User t = teacher(email);
        return activities.findAll().stream()
                .filter(a -> a.getTeacher().getId().equals(t.getId()))
                .sorted(Comparator.comparing(ListeningActivity::getUpdatedAt).reversed())
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public ListeningResponse get(String email, Long id) {
        User t = teacher(email);
        return response(owned(id, t.getId()));
    }

    public ListeningResponse save(String email, Long id, ListeningRequest r) {
        User t = teacher(email);
        ListeningActivity a = id == null ? new ListeningActivity() : owned(id, t.getId());
        if (id != null && attempts.existsByActivityId(id)) {
            throw new IllegalArgumentException(
                    "Bài Listening đã có học viên nộp. Không thể sửa nội dung để bảo toàn kết quả; hãy tạo bài mới nếu cần thay đổi.");
        }
        if (id == null) a.setTeacher(t);
        a.setCourseWeek(week(r, t.getId()));
        a.setLesson(lesson(r.lessonId(), r.courseWeekId(), t.getId()));
        a.setTitle(r.title().trim());
        a.setDescription(clean(r.description()));
        a.setInstruction(clean(r.instruction()));
        a.setAudioUrl(clean(r.audioUrl()));
        // Ẩn/hiện chỉ còn ở khóa học và tuần; bài và học liệu luôn hiển thị.
        a.setStatus(ListeningActivity.Status.PUBLISHED);
        if (a.getAudioUrl() == null) {
            throw new IllegalArgumentException("Bài Listening cần có file âm thanh");
        }
        if (r.questions() == null || r.questions().isEmpty()) {
            throw new IllegalArgumentException("Bài Listening cần có ít nhất một câu hỏi");
        }
        activities.save(a);
        if (id != null) {
            for (ListeningQuestion q : questions.findAllByActivityIdOrderBySortOrderAsc(a.getId()))
                questions.delete(q);
            questions.flush();
        }
        int qi = 1;
        if (r.questions() != null)
            for (ListeningRequest.Question qr : r.questions()) {
                ListeningQuestion q = new ListeningQuestion();
                q.setActivity(a);
                q.setQuestionText(qr.questionText().trim());
                q.setSortOrder(qi++);
                questions.save(q);
                int oi = 1;
                if (qr.options() != null)
                    for (ListeningRequest.Option or : qr.options()) {
                        ListeningOption o = new ListeningOption();
                        o.setQuestion(q);
                        o.setOptionText(or.optionText().trim());
                        o.setCorrect(or.correct());
                        o.setSortOrder(oi++);
                        options.save(o);
                        q.getOptions().add(o);
                    }
            }
        return response(a);
    }

    public void delete(String email, Long id) {
        User t = teacher(email);
        ListeningActivity activity = owned(id, t.getId());
        if (attempts.existsByActivityId(id)) {
            throw new IllegalArgumentException(
                    "Bài Listening đã có học viên nộp nên không thể xóa. Hãy giữ bài để bảo toàn lịch sử kết quả.");
        }
        activities.delete(activity);
    }

    private ListeningActivity owned(Long id, Long tid) {
        return activities
                .findById(id)
                .filter(a -> a.getTeacher().getId().equals(tid))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài Listening"));
    }

    private elearning.entity.CourseWeek week(ListeningRequest r, Long teacherId) {
        return weeks.findById(r.courseWeekId())
                .filter(w -> w.getCourse().getCreatedByTeacher().getId().equals(teacherId))
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Tuần học không thuộc khóa học của giáo viên"));
    }

    private Lesson lesson(Long lessonId, Long weekId, Long teacherId) {
        if (lessonId == null) {
            throw new IllegalArgumentException("Vui lòng chọn bài học trước khi tạo bài Listening");
        }
        Lesson lesson =
                lessons.findByIdAndCreatedByTeacherId(lessonId, teacherId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        if (lesson.getCourseWeek() == null || !lesson.getCourseWeek().getId().equals(weekId)) {
            throw new IllegalArgumentException("Bài học không thuộc tuần đã chọn");
        }
        return lesson;
    }

    public Long teacherId(String email) {
        return teacher(email).getId();
    }

    private User teacher(String e) {
        return users.findByEmailIgnoreCase(e)
                .filter(u -> u.getRole() == UserRole.TEACHER && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giáo viên"));
    }

    private String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private ListeningResponse response(ListeningActivity a) {
        return new ListeningResponse(
                a.getId(),
                a.getCourseWeek().getId(),
                a.getLesson() == null ? null : a.getLesson().getId(),
                a.getTitle(),
                a.getDescription(),
                a.getInstruction(),
                a.getAudioUrl(),
                a.getStatus().name(),
                questions.findAllByActivityIdOrderBySortOrderAsc(a.getId()).stream()
                        .map(
                                q ->
                                        new ListeningResponse.Question(
                                                q.getId(),
                                                q.getQuestionText(),
                                                q.getOptions().stream()
                                                        .map(
                                                                o ->
                                                                        new ListeningResponse
                                                                                .Option(
                                                                                o.getId(),
                                                                                o.getOptionText(),
                                                                                o.isCorrect()))
                                                        .toList()))
                        .toList(),
                a.getId() != null && attempts.existsByActivityId(a.getId()),
                a.getId() == null ? 0 : attempts.countByActivityId(a.getId()));
    }
}
