package elearning.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.multipart.MultipartFile;

/** Course-level, versioned final tests. Published section snapshots never change. */
@Service
public class FinalTestService {
    // Thời gian chỉ tính theo cả Test (time_limit_minutes); duration của phần giữ lại trong schema, mặc định 1.
    public record SectionInput(String type, Long sourceId, int durationMinutes, BigDecimal points) {}
    public record DraftInput(String title, String description, int timeLimitMinutes,
                             BigDecimal passPercent, List<SectionInput> sections) {}

    private final JdbcTemplate db;
    private final ObjectMapper json;
    private final elearning.service.MediaStorageService media;

    public FinalTestService(JdbcTemplate db, ObjectMapper json, elearning.service.MediaStorageService media) {
        this.db = db;
        this.json = json;
        this.media = media;
    }

    private List<Map<String, Object>> rows(String sql, Object... args) {
        return db.queryForList(sql, args);
    }

    private Map<String, Object> one(String sql, Object... args) {
        List<Map<String, Object>> found = rows(sql, args);
        if (found.isEmpty()) throw new IllegalArgumentException("Không tìm thấy dữ liệu hoặc không có quyền truy cập");
        return found.get(0);
    }

    private long number(Object value) { return ((Number) value).longValue(); }
    private boolean truth(Object value) {
        return value instanceof Boolean b ? b : value instanceof Number n && n.intValue() != 0;
    }
    private long id(Map<String, Object> value) { return number(value.get("id")); }
    private String string(Object value) { return value == null ? null : value.toString(); }
    private LocalDateTime dateTime(Object value) {
        return value instanceof LocalDateTime time ? time : ((java.sql.Timestamp) value).toLocalDateTime();
    }
    private BigDecimal decimal(Object value) { return (BigDecimal) value; }
    private String write(Object value) {
        try { return json.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new IllegalArgumentException("Nội dung Test không hợp lệ", e); }
    }
    private Map<String, Object> read(Object value) {
        try { return json.readValue(string(value), new TypeReference<>() {}); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Không đọc được phiên bản đề", e); }
    }
    private long insert(String sql, Object... args) {
        KeyHolder key = new GeneratedKeyHolder();
        db.update(connection -> {
            var statement = connection.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) statement.setObject(i + 1, args[i]);
            return statement;
        }, key);
        return key.getKey().longValue();
    }

    private long user(String email) {
        return number(one("SELECT id FROM users WHERE email=? AND status='ACTIVE'", email).get("id"));
    }
    private Map<String, Object> teacherCourse(long courseId, String email) {
        long userId = user(email);
        return one("SELECT c.* FROM courses c JOIN users u ON u.id=? WHERE c.id=? AND (c.created_by_teacher_id=? OR u.role='ADMIN')", userId, courseId, userId);
    }

    public List<Map<String, Object>> catalog(long courseId, String email) {
        Map<String, Object> course = teacherCourse(courseId, email);
        long owner = number(course.get("created_by_teacher_id"));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> q : rows("SELECT q.id, q.question_text AS title, 'QUESTION' AS type FROM questions q LEFT JOIN lessons l ON l.id=q.lesson_id LEFT JOIN course_weeks w ON w.id=l.course_week_id WHERE q.created_by_teacher_id=? AND q.status='ACTIVE' AND (q.lesson_id IS NULL OR w.course_id=?) ORDER BY q.id DESC", owner, courseId)) result.add(q);
        result.addAll(rows("SELECT s.id, CONCAT(s.title, ' · ', (SELECT COUNT(*) FROM test_bank_question_set_items i WHERE i.set_id=s.id), ' câu') AS title, 'QUESTION_SET' AS type FROM test_bank_question_sets s WHERE s.created_by_teacher_id=? AND s.status='ACTIVE' ORDER BY s.id DESC", owner));
        // Nghe/Đọc/Nói lấy từ Ngân hàng đề thi của giáo viên chủ khóa, không phụ thuộc khóa/tuần/bài.
        for (String type : List.of("LISTENING", "READING", "SPEAKING")) {
            result.addAll(rows("SELECT a.id, a.title, '" + type + "' AS type FROM " + table(type) + " a WHERE a.created_by_teacher_id=? AND a.status='ACTIVE' ORDER BY a.id DESC", owner));
        }
        return result;
    }

    private String table(String type) {
        return switch (type) {
            case "QUESTION_SET" -> "test_bank_question_sets";
            case "LISTENING" -> "test_bank_listening_items";
            case "READING" -> "test_bank_reading_items";
            case "SPEAKING" -> "test_bank_speaking_items";
            default -> throw new IllegalArgumentException("Loại học liệu không hợp lệ");
        };
    }

    @Transactional
    public Map<String, Object> saveDraft(long courseId, String email, DraftInput input) {
        Map<String, Object> course = teacherCourse(courseId, email);
        if (input.title() == null || input.title().isBlank() || input.title().length() > 220)
            throw new IllegalArgumentException("Cần nhập tên Test (tối đa 220 ký tự)");
        if (input.timeLimitMinutes() < 1 || input.timeLimitMinutes() > 360)
            throw new IllegalArgumentException("Thời gian phải từ 1 đến 360 phút");
        if (input.passPercent() == null || input.passPercent().compareTo(BigDecimal.ZERO) < 0 || input.passPercent().compareTo(new BigDecimal("100")) > 0)
            throw new IllegalArgumentException("Điều kiện đạt phải từ 0 đến 100%");
        if (input.sections() == null || input.sections().isEmpty())
            throw new IllegalArgumentException("Test cần ít nhất một phần");
        long teacherId = number(course.get("created_by_teacher_id"));
        List<Map<String, Object>> tests = rows("SELECT * FROM course_tests WHERE course_id=? FOR UPDATE", courseId);
        long testId;
        if (tests.isEmpty()) {
            testId = insert("INSERT INTO course_tests(course_id,created_by_teacher_id,title,description) VALUES (?,?,?,?)", courseId, teacherId, input.title().trim(), input.description());
        } else {
            testId = id(tests.get(0));
            db.update("UPDATE course_tests SET title=?,description=? WHERE id=?", input.title().trim(), input.description(), testId);
        }
        List<Map<String, Object>> drafts = rows("SELECT * FROM test_versions WHERE test_id=? AND status='DRAFT' FOR UPDATE", testId);
        long versionId;
        int versionNo;
        if (drafts.isEmpty()) {
            versionNo = db.queryForObject("SELECT COALESCE(MAX(version_no),0)+1 FROM test_versions WHERE test_id=?", Integer.class, testId);
            versionId = insert("INSERT INTO test_versions(test_id,version_no,time_limit_minutes,pass_percent) VALUES (?,?,?,?)", testId, versionNo, input.timeLimitMinutes(), input.passPercent());
        } else {
            versionId = id(drafts.get(0));
            versionNo = ((Number) drafts.get(0).get("version_no")).intValue();
            db.update("DELETE FROM test_sections WHERE version_id=?", versionId);
            db.update("UPDATE test_versions SET time_limit_minutes=?,pass_percent=? WHERE id=?", input.timeLimitMinutes(), input.passPercent(), versionId);
        }
        BigDecimal total = BigDecimal.ZERO;
        int order = 0;
        for (SectionInput section : input.sections()) {
            if (section == null || section.sourceId() == null || section.points() == null || section.points().compareTo(BigDecimal.ZERO) <= 0)
                throw new IllegalArgumentException("Điểm của mỗi phần phải lớn hơn 0");
            if (section.points().scale() > 2) throw new IllegalArgumentException("Điểm chỉ hỗ trợ hai chữ số thập phân");
            Map<String, Object> snapshot = snapshot(courseId, teacherId, section);
            String type = section.type().toUpperCase();
            List<?> questions = (List<?>) snapshot.get("questions");
            db.update("INSERT INTO test_sections(version_id,sort_order,source_type,source_question_id,source_test_listening_id,source_test_reading_id,source_test_speaking_id,source_test_question_set_id,title,duration_minutes,question_count,max_points,snapshot_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    versionId, ++order, type,
                    type.equals("QUESTION") ? section.sourceId() : null,
                    type.equals("LISTENING") ? section.sourceId() : null,
                    type.equals("READING") ? section.sourceId() : null,
                    type.equals("SPEAKING") ? section.sourceId() : null,
                    type.equals("QUESTION_SET") ? section.sourceId() : null,
                    snapshot.get("title"), Math.max(1, section.durationMinutes()), questions.size(), section.points(), write(snapshot));
            total = total.add(section.points());
        }
        db.update("UPDATE test_versions SET total_points=? WHERE id=?", total, versionId);
        return teacherGet(courseId, email);
    }

    private Map<String, Object> snapshot(long courseId, long teacherId, SectionInput section) {
        String type = section.type() == null ? "" : section.type().toUpperCase();
        long sourceId = section.sourceId();
        Map<String, Object> source;
        Map<String, Object> snapshot = new LinkedHashMap<>();
        List<Map<String, Object>> questions = new ArrayList<>();
        if (type.equals("QUESTION")) {
            source = one("SELECT q.* FROM questions q LEFT JOIN lessons l ON l.id=q.lesson_id LEFT JOIN course_weeks w ON w.id=l.course_week_id WHERE q.id=? AND q.created_by_teacher_id=? AND q.status='ACTIVE' AND (q.lesson_id IS NULL OR w.course_id=?)", sourceId, teacherId, courseId);
            snapshot.put("title", "Câu hỏi ngân hàng");
            questions.add(question(sourceId, string(source.get("question_text")), string(source.get("explanation")),
                    rows("SELECT id,content AS text,is_correct AS correct FROM answer_options WHERE question_id=? ORDER BY sort_order", sourceId)));
            snapshot.put("passage", source.get("passage_text"));
            snapshot.put("audioUrl", source.get("audio_url"));
        } else if (type.equals("QUESTION_SET")) {
            source = one("SELECT a.* FROM test_bank_question_sets a WHERE a.id=? AND a.created_by_teacher_id=? AND a.status='ACTIVE'", sourceId, teacherId);
            snapshot.put("title", source.get("title"));
            snapshot.put("instruction", source.get("description"));
            for (Map<String, Object> q : rows("SELECT q.* FROM test_bank_question_set_items i JOIN questions q ON q.id=i.question_id WHERE i.set_id=? ORDER BY i.sort_order", sourceId)) {
                if (!"ACTIVE".equals(string(q.get("status"))) || number(q.get("created_by_teacher_id")) != teacherId)
                    throw new IllegalArgumentException("Bộ đề có câu hỏi không còn hoạt động: " + q.get("id"));
                if (string(q.get("audio_url")) != null && !string(q.get("audio_url")).isBlank())
                    throw new IllegalArgumentException("Bộ đề có câu hỏi kèm file nghe riêng: " + q.get("id"));
                Map<String, Object> item = question(id(q), string(q.get("question_text")), string(q.get("explanation")),
                        rows("SELECT id,content AS text,is_correct AS correct FROM answer_options WHERE question_id=? ORDER BY sort_order", id(q)));
                // Đoạn văn riêng của câu hỏi (nếu có) hiện ngay trước câu đó cho học viên.
                item.put("passage", q.get("passage_text"));
                questions.add(item);
            }
        } else {
            source = one("SELECT a.* FROM " + table(type) + " a WHERE a.id=? AND a.created_by_teacher_id=? AND a.status='ACTIVE'", sourceId, teacherId);
            snapshot.put("title", source.get("title"));
            snapshot.put("instruction", source.get("instruction"));
            if (type.equals("LISTENING")) {
                String audio = string(source.get("audio_url"));
                if (audio == null || audio.isBlank() || (audio.startsWith("/uploads/") && !media.load(audio).exists()))
                    throw new IllegalArgumentException("File nghe Listening không tồn tại");
                snapshot.put("audioUrl", audio);
                for (Map<String, Object> q : rows("SELECT id,question_text FROM test_bank_listening_questions WHERE item_id=? ORDER BY sort_order", sourceId)) {
                    long qid = id(q);
                    questions.add(question(qid, string(q.get("question_text")), null,
                            rows("SELECT id,option_text AS text,is_correct AS correct FROM test_bank_listening_options WHERE question_id=? ORDER BY sort_order", qid)));
                }
            } else if (type.equals("READING")) {
                snapshot.put("passage", source.get("passage"));
                List<Map<String, Object>> attachments = rows("SELECT id,title,url,file_name,mime_type FROM test_bank_reading_attachments WHERE item_id=? ORDER BY sort_order", sourceId);
                if ((source.get("passage") == null || string(source.get("passage")).isBlank()) && attachments.isEmpty())
                    throw new IllegalArgumentException("Reading thiếu đoạn văn hoặc tệp đọc");
                for (Map<String, Object> attachment : attachments) {
                    String url = string(attachment.get("url"));
                    if (url.startsWith("/uploads/") && !media.load(url).exists())
                        throw new IllegalArgumentException("Tệp Reading không tồn tại: " + attachment.get("title"));
                }
                snapshot.put("attachments", attachments);
                for (Map<String, Object> q : rows("SELECT id,question_text,explanation,evidence FROM test_bank_reading_questions WHERE item_id=? ORDER BY sort_order", sourceId)) {
                    long qid = id(q);
                    Map<String, Object> item = question(qid, string(q.get("question_text")), string(q.get("explanation")),
                            rows("SELECT id,option_text AS text,is_correct AS correct FROM test_bank_reading_options WHERE question_id=? ORDER BY sort_order", qid));
                    item.put("evidence", q.get("evidence"));
                    questions.add(item);
                }
            } else {
                snapshot.put("prompt", source.get("prompt_text"));
                if ((source.get("prompt_text") == null || string(source.get("prompt_text")).isBlank())
                        && (source.get("instruction") == null || string(source.get("instruction")).isBlank()))
                    throw new IllegalArgumentException("Speaking thiếu đề bài");
            }
        }
        if (!type.equals("SPEAKING") && questions.isEmpty())
            throw new IllegalArgumentException("Phần " + type + " chưa có câu hỏi");
        snapshot.put("questions", questions);
        return snapshot;
    }

    private Map<String, Object> question(long id, String text, String explanation, List<Map<String, Object>> options) {
        if (options.size() < 2 || options.stream().filter(o -> truth(o.get("correct"))).count() != 1)
            throw new IllegalArgumentException("Câu hỏi " + id + " cần ít nhất hai đáp án và đúng một đáp án chính xác");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("key", String.valueOf(id));
        result.put("text", text);
        result.put("explanation", explanation);
        result.put("options", options);
        return result;
    }

    public Map<String, Object> teacherGet(long courseId, String email) {
        teacherCourse(courseId, email);
        List<Map<String, Object>> tests = rows("SELECT * FROM course_tests WHERE course_id=?", courseId);
        if (tests.isEmpty()) return Map.of("exists", false);
        Map<String, Object> test = new LinkedHashMap<>(tests.get(0));
        List<Map<String, Object>> versions = rows("SELECT * FROM test_versions WHERE test_id=? ORDER BY version_no DESC", id(test));
        for (Map<String, Object> version : versions) {
            List<Map<String, Object>> sections = rows("SELECT * FROM test_sections WHERE version_id=? ORDER BY sort_order", id(version));
            for (Map<String, Object> section : sections) section.put("snapshot", read(section.remove("snapshot_json")));
            version.put("sections", sections);
        }
        test.put("versions", versions);
        test.put("exists", true);
        return test;
    }

    @Transactional
    public Map<String, Object> publish(long courseId, String email) {
        teacherCourse(courseId, email);
        Map<String, Object> test = one("SELECT * FROM course_tests WHERE course_id=? FOR UPDATE", courseId);
        Map<String, Object> version = one("SELECT * FROM test_versions WHERE test_id=? AND status='DRAFT' ORDER BY version_no DESC LIMIT 1", id(test));
        List<Map<String, Object>> sections = rows("SELECT * FROM test_sections WHERE version_id=? ORDER BY sort_order", id(version));
        if (sections.isEmpty() || decimal(version.get("total_points")).compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Test chưa có phần hợp lệ");
        BigDecimal total = BigDecimal.ZERO;
        for (Map<String, Object> section : sections) {
            String type = string(section.get("source_type"));
            String sourceColumn = switch (type) {
                case "QUESTION" -> "source_question_id";
                case "QUESTION_SET" -> "source_test_question_set_id";
                case "LISTENING" -> "source_test_listening_id";
                case "READING" -> "source_test_reading_id";
                case "SPEAKING" -> "source_test_speaking_id";
                default -> throw new IllegalArgumentException("Loại phần Test không hợp lệ");
            };
            Map<String, Object> fresh = snapshot(courseId, number(test.get("created_by_teacher_id")),
                    new SectionInput(type, number(section.get(sourceColumn)), ((Number) section.get("duration_minutes")).intValue(), decimal(section.get("max_points"))));
            db.update("UPDATE test_sections SET snapshot_json=?,question_count=?,title=? WHERE id=?", write(fresh), ((List<?>) fresh.get("questions")).size(), fresh.get("title"), id(section));
            total = total.add(decimal(section.get("max_points")));
        }
        if (total.compareTo(decimal(version.get("total_points"))) != 0)
            throw new IllegalArgumentException("Tổng điểm các phần không khớp");
        db.update("UPDATE test_versions SET status='SUPERSEDED' WHERE test_id=? AND status='PUBLISHED'", id(test));
        db.update("UPDATE test_versions SET status='PUBLISHED',published_at=NOW() WHERE id=?", id(version));
        // Lần xuất bản đầu tiên: Test ở trạng thái ẨN, giáo viên tự bật Hiển thị khi sẵn sàng; các lần sau giữ nguyên trạng thái.
        db.update("UPDATE course_tests SET status=CASE WHEN status='DRAFT' THEN 'HIDDEN' ELSE status END,current_version_no=? WHERE id=?", version.get("version_no"), id(test));
        return teacherGet(courseId, email);
    }

    /** Hiện lại Test đã ẩn (không cần bản nháp mới). */
    @Transactional
    public Map<String, Object> show(long courseId, String email) {
        teacherCourse(courseId, email);
        Map<String, Object> test = one("SELECT current_version_no FROM course_tests WHERE course_id=?", courseId);
        if (test.get("current_version_no") == null)
            throw new IllegalArgumentException("Test chưa được lưu. Hãy bấm Lưu Test trước.");
        db.update("UPDATE course_tests SET status='PUBLISHED' WHERE course_id=?", courseId);
        return teacherGet(courseId, email);
    }

    @Transactional
    public Map<String, Object> hide(long courseId, String email) {
        teacherCourse(courseId, email);
        db.update("UPDATE course_tests SET status='HIDDEN' WHERE course_id=?", courseId);
        return teacherGet(courseId, email);
    }

    /**
     * Nội dung ngân hàng (bộ đề, bài Nghe/Đọc/Nói, câu hỏi) vừa được sửa: cập nhật các phần Test đang dùng nó.
     * Phiên bản đã có lượt làm giữ nguyên để không đổi đề và kết quả cũ.
     */
    @Transactional
    public void refreshSections(String type, long sourceId) {
        String column = switch (type) {
            case "QUESTION" -> "source_question_id";
            case "QUESTION_SET" -> "source_test_question_set_id";
            case "LISTENING" -> "source_test_listening_id";
            case "READING" -> "source_test_reading_id";
            case "SPEAKING" -> "source_test_speaking_id";
            default -> throw new IllegalArgumentException("Loại phần Test không hợp lệ");
        };
        for (Map<String, Object> section : rows("SELECT s.id, t.course_id, t.created_by_teacher_id FROM test_sections s JOIN test_versions v ON v.id=s.version_id JOIN course_tests t ON t.id=v.test_id WHERE s." + column + "=? AND NOT EXISTS (SELECT 1 FROM test_attempts a WHERE a.version_id=s.version_id)", sourceId)) {
            try {
                Map<String, Object> fresh = snapshot(number(section.get("course_id")), number(section.get("created_by_teacher_id")),
                        new SectionInput(type, sourceId, 1, BigDecimal.ONE));
                db.update("UPDATE test_sections SET snapshot_json=?, question_count=?, title=? WHERE id=?",
                        write(fresh), ((List<?>) fresh.get("questions")).size(), fresh.get("title"), id(section));
            } catch (IllegalArgumentException invalid) {
                // Nội dung không còn hợp lệ (ví dụ câu hỏi bị ẩn): giữ bản cũ, lỗi sẽ báo khi lưu Test.
            }
        }
    }

    /** Câu hỏi của ngân hàng vừa đổi: cập nhật các bộ đề chứa nó và các phần câu hỏi lẻ cũ. */
    @Transactional
    public void refreshForQuestion(long questionId) {
        for (Map<String, Object> set : rows("SELECT DISTINCT set_id FROM test_bank_question_set_items WHERE question_id=?", questionId))
            refreshSections("QUESTION_SET", number(set.get("set_id")));
        refreshSections("QUESTION", questionId);
    }

    /** Xóa hẳn Test của khóa (mọi phiên bản). Đã có lượt làm thì không xóa được, chỉ ẩn. */
    @Transactional
    public void delete(long courseId, String email) {
        teacherCourse(courseId, email);
        List<Map<String, Object>> tests = rows("SELECT id FROM course_tests WHERE course_id=? FOR UPDATE", courseId);
        if (tests.isEmpty()) return;
        long testId = id(tests.get(0));
        Integer attempts = db.queryForObject("SELECT COUNT(*) FROM test_attempts WHERE test_id=?", Integer.class, testId);
        if (attempts != null && attempts > 0)
            throw new IllegalArgumentException("Test đã có lượt làm của học viên nên không thể xóa. Hãy ẩn Test nếu không muốn học viên làm nữa.");
        db.update("DELETE FROM test_versions WHERE test_id=?", testId); // các phần của đề xóa theo (ON DELETE CASCADE)
        db.update("DELETE FROM course_tests WHERE id=?", testId);
    }

    public Map<String, Object> studentInfo(long courseId, String email) {
        long studentId = user(email);
        List<Map<String, Object>> tests = rows("SELECT t.*,v.id AS version_id,v.time_limit_minutes,v.total_points FROM course_tests t JOIN test_versions v ON v.test_id=t.id AND v.version_no=t.current_version_no WHERE t.course_id=? AND t.status='PUBLISHED'", courseId);
        if (tests.isEmpty()) return Map.of("exists", false);
        Map<String, Object> test = tests.get(0);
        boolean eligible = eligible(courseId, studentId);
        List<Map<String, Object>> attempts = rows("SELECT id,status,started_at,expires_at,submitted_at,earned_points,total_points,passed FROM test_attempts WHERE test_id=? AND version_id=? AND student_id=? LIMIT 1", id(test), test.get("version_id"), studentId);
        return Map.of("exists", true, "id", id(test), "title", test.get("title"), "eligible", eligible,
                "timeLimitMinutes", test.get("time_limit_minutes"), "totalPoints", test.get("total_points"),
                "attempt", attempts.isEmpty() ? Map.of() : attempts.get(0));
    }

    public List<Map<String, Object>> studentResults(String email) {
        return rows("SELECT a.id,a.status,a.started_at,a.submitted_at,a.earned_points,a.total_points,a.passed,t.course_id,t.title FROM test_attempts a JOIN course_tests t ON t.id=a.test_id WHERE a.student_id=? ORDER BY a.started_at DESC", user(email));
    }

    private boolean eligible(long courseId, long studentId) {
        boolean enrolled = !rows("SELECT e.id FROM class_enrollments e JOIN classes c ON c.id=e.class_id WHERE c.course_id=? AND e.student_id=? AND e.status IN ('ACTIVE','COMPLETED') LIMIT 1", courseId, studentId).isEmpty();
        if (!enrolled) return false;
        int missing = db.queryForObject("SELECT COUNT(*) FROM lessons l JOIN course_weeks w ON w.id=l.course_week_id LEFT JOIN lesson_progress p ON p.lesson_id=l.id AND p.student_id=? WHERE w.course_id=? AND w.status='PUBLISHED' AND l.status='PUBLISHED' AND (p.id IS NULL OR p.status<>'COMPLETED')", Integer.class, studentId, courseId);
        return missing == 0;
    }

    // READ_COMMITTED: a parallel click that hits the unique key must see the other request's committed attempt.
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String, Object> start(long courseId, String email) {
        long studentId = user(email);
        if (!eligible(courseId, studentId)) throw new IllegalArgumentException("Bạn cần hoàn thành khóa học và có quyền học trước khi mở Test");
        Map<String, Object> test = one("SELECT t.*,v.id AS version_id,v.time_limit_minutes,v.total_points FROM course_tests t JOIN test_versions v ON v.test_id=t.id AND v.version_no=t.current_version_no WHERE t.course_id=? AND t.status='PUBLISHED'", courseId);
        long versionId = number(test.get("version_id"));
        try {
            db.update("INSERT INTO test_attempts(test_id,version_id,student_id,expires_at,total_points) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL ? MINUTE),?)",
                    id(test), versionId, studentId, test.get("time_limit_minutes"), test.get("total_points"));
        } catch (DuplicateKeyException ignored) { /* A parallel click resumes the same attempt. */ }
        Map<String, Object> attempt = one("SELECT id FROM test_attempts WHERE test_id=? AND version_id=? AND student_id=?", id(test), versionId, studentId);
        return attempt(id(attempt), email);
    }

    @Transactional
    public Map<String, Object> attempt(long attemptId, String email) {
        Map<String, Object> attempt = studentAttempt(attemptId, email);
        expire(attempt);
        attempt = studentAttempt(attemptId, email);
        Map<String, Object> result = new LinkedHashMap<>(attempt);
        List<Map<String, Object>> sections = rows("SELECT * FROM test_sections WHERE version_id=? ORDER BY sort_order", attempt.get("version_id"));
        boolean finished = !"IN_PROGRESS".equals(attempt.get("status"));
        for (Map<String, Object> section : sections) {
            Map<String, Object> snapshot = read(section.remove("snapshot_json"));
            if (!finished) {
                for (Map<String, Object> q : (List<Map<String, Object>>) snapshot.get("questions")) {
                    q.remove("explanation");
                    q.remove("evidence");
                    for (Map<String, Object> option : (List<Map<String, Object>>) q.get("options")) option.remove("correct");
                }
            }
            section.put("snapshot", snapshot);
            section.put("answers", rows("SELECT question_key,selected_option_id,is_correct FROM test_answers WHERE attempt_id=? AND section_id=?", attemptId, id(section)));
            section.put("recording", rows("SELECT storage_url,mime_type,size_bytes FROM test_recordings WHERE attempt_id=? AND section_id=?", attemptId, id(section)));
            if (finished) section.put("score", rows("SELECT earned_points,max_points,feedback,graded_at FROM test_section_scores WHERE attempt_id=? AND section_id=?", attemptId, id(section)));
        }
        result.put("sections", sections);
        return result;
    }

    private Map<String, Object> studentAttempt(long attemptId, String email) {
        return one("SELECT a.*,t.course_id,t.title,v.pass_percent FROM test_attempts a JOIN course_tests t ON t.id=a.test_id JOIN test_versions v ON v.id=a.version_id WHERE a.id=? AND a.student_id=?", attemptId, user(email));
    }
    private void expire(Map<String, Object> attempt) {
        if ("IN_PROGRESS".equals(attempt.get("status")) && !LocalDateTime.now().isBefore(dateTime(attempt.get("expires_at"))))
            submitLocked(id(attempt), true);
    }

    @Transactional
    public Map<String, Object> saveAnswer(long attemptId, long sectionId, String questionKey, Long optionId, String email) {
        Map<String, Object> attempt = studentAttempt(attemptId, email);
        db.queryForMap("SELECT id FROM test_attempts WHERE id=? FOR UPDATE", attemptId);
        expire(attempt);
        if (!"IN_PROGRESS".equals(studentAttempt(attemptId, email).get("status"))) throw new IllegalArgumentException("Test đã nộp hoặc hết giờ");
        Map<String, Object> section = one("SELECT * FROM test_sections WHERE id=? AND version_id=?", sectionId, attempt.get("version_id"));
        Map<String, Object> snapshot = read(section.get("snapshot_json"));
        boolean valid = false;
        for (Map<String, Object> q : (List<Map<String, Object>>) snapshot.get("questions")) {
            if (!string(q.get("key")).equals(questionKey)) continue;
            valid = optionId == null || ((List<Map<String, Object>>) q.get("options")).stream().anyMatch(o -> number(o.get("id")) == optionId);
        }
        if (!valid) throw new IllegalArgumentException("Đáp án không thuộc câu hỏi này");
        db.update("INSERT INTO test_answers(attempt_id,section_id,question_key,selected_option_id) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE selected_option_id=VALUES(selected_option_id),saved_at=NOW()", attemptId, sectionId, questionKey, optionId);
        return Map.of("saved", true);
    }

    @Transactional
    public Map<String, Object> saveRecording(long attemptId, long sectionId, MultipartFile file, String email) throws IOException {
        Map<String, Object> attempt = studentAttempt(attemptId, email);
        db.queryForMap("SELECT id FROM test_attempts WHERE id=? FOR UPDATE", attemptId);
        expire(attempt);
        if (!"IN_PROGRESS".equals(studentAttempt(attemptId, email).get("status"))) throw new IllegalArgumentException("Test đã nộp hoặc hết giờ");
        one("SELECT id FROM test_sections WHERE id=? AND version_id=? AND source_type='SPEAKING'", sectionId, attempt.get("version_id"));
        String url = media.store(file, "test-speaking");
        db.update("INSERT INTO test_recordings(attempt_id,section_id,storage_url,mime_type,size_bytes) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE storage_url=VALUES(storage_url),mime_type=VALUES(mime_type),size_bytes=VALUES(size_bytes),saved_at=NOW()", attemptId, sectionId, url, file.getContentType(), file.getSize());
        return Map.of("url", url, "saved", true);
    }

    @Transactional
    public Map<String, Object> submit(long attemptId, String email) {
        studentAttempt(attemptId, email);
        submitLocked(attemptId, false);
        return attempt(attemptId, email);
    }

    private void submitLocked(long attemptId, boolean automatic) {
        Map<String, Object> attempt = one("SELECT * FROM test_attempts WHERE id=? FOR UPDATE", attemptId);
        if (!"IN_PROGRESS".equals(attempt.get("status"))) return;
        boolean expired = !LocalDateTime.now().isBefore(dateTime(attempt.get("expires_at")));
        List<Map<String, Object>> sections = rows("SELECT * FROM test_sections WHERE version_id=? ORDER BY sort_order", attempt.get("version_id"));
        boolean speaking = false;
        BigDecimal totalEarned = BigDecimal.ZERO;
        for (Map<String, Object> section : sections) {
            long sectionId = id(section);
            if ("SPEAKING".equals(section.get("source_type"))) { speaking = true; continue; }
            Map<String, Object> snapshot = read(section.get("snapshot_json"));
            List<Map<String, Object>> questions = (List<Map<String, Object>>) snapshot.get("questions");
            Map<String, Object> answers = new HashMap<>();
            for (Map<String, Object> answer : rows("SELECT question_key,selected_option_id FROM test_answers WHERE attempt_id=? AND section_id=?", attemptId, sectionId)) answers.put(string(answer.get("question_key")), answer.get("selected_option_id"));
            int correct = 0;
            for (Map<String, Object> q : questions) {
                Object selected = answers.get(string(q.get("key")));
                boolean hit = selected != null && ((List<Map<String, Object>>) q.get("options")).stream().anyMatch(o -> number(o.get("id")) == number(selected) && truth(o.get("correct")));
                if (hit) correct++;
                db.update("UPDATE test_answers SET is_correct=? WHERE attempt_id=? AND section_id=? AND question_key=?", hit, attemptId, sectionId, q.get("key"));
            }
            BigDecimal max = decimal(section.get("max_points"));
            BigDecimal earned = max.multiply(BigDecimal.valueOf(correct)).divide(BigDecimal.valueOf(questions.size()), 2, RoundingMode.HALF_UP);
            totalEarned = totalEarned.add(earned);
            db.update("INSERT INTO test_section_scores(attempt_id,section_id,earned_points,max_points,graded_at) VALUES (?,?,?,?,NOW())", attemptId, sectionId, earned, max);
        }
        if (speaking) {
            db.update("UPDATE test_attempts SET status='PENDING_GRADING',submitted_at=NOW(),auto_submitted=?,earned_points=NULL,passed=NULL WHERE id=?", automatic || expired, attemptId);
        } else {
            BigDecimal percent = totalEarned.multiply(new BigDecimal("100")).divide(decimal(attempt.get("total_points")), 2, RoundingMode.HALF_UP);
            BigDecimal pass = decimal(one("SELECT pass_percent FROM test_versions WHERE id=?", attempt.get("version_id")).get("pass_percent"));
            db.update("UPDATE test_attempts SET status='GRADED',submitted_at=NOW(),auto_submitted=?,earned_points=?,passed=? WHERE id=?", automatic || expired, totalEarned, percent.compareTo(pass) >= 0, attemptId);
        }
        String title = string(one("SELECT title FROM course_tests WHERE id=?", attempt.get("test_id")).get("title"));
        long minutes = Math.max(1, java.time.Duration.between(dateTime(attempt.get("started_at")), LocalDateTime.now()).toMinutes());
        db.update("INSERT INTO learning_history(student_id,activity_type,activity_id,activity_name,created_at) VALUES (?,'TEST',?,?,NOW()) ON DUPLICATE KEY UPDATE activity_name=VALUES(activity_name)", attempt.get("student_id"), attemptId, title);
        db.update("INSERT INTO daily_learning_statistics(student_id,learning_date,learning_minutes,lessons_completed,test_completed) VALUES (?,CURDATE(),?,0,1) ON DUPLICATE KEY UPDATE learning_minutes=learning_minutes+VALUES(learning_minutes),test_completed=test_completed+1", attempt.get("student_id"), minutes);
    }

    @Scheduled(fixedDelay = 60_000L, initialDelay = 60_000L)
    @Transactional
    public void submitExpiredAttempts() {
        for (Map<String, Object> row : rows("SELECT id FROM test_attempts WHERE status='IN_PROGRESS' AND expires_at<=NOW() ORDER BY expires_at LIMIT 100"))
            submitLocked(id(row), true);
    }

    public List<Map<String, Object>> teacherAttempts(long courseId, String email) {
        teacherCourse(courseId, email);
        return rows("SELECT a.id,a.student_id,u.full_name,a.status,a.started_at,a.submitted_at,a.earned_points,a.total_points,a.passed FROM test_attempts a JOIN course_tests t ON t.id=a.test_id JOIN users u ON u.id=a.student_id WHERE t.course_id=? ORDER BY a.started_at DESC", courseId);
    }

    public Map<String, Object> teacherAttempt(long courseId, long attemptId, String email) {
        teacherCourse(courseId, email);
        Map<String, Object> attempt = one("SELECT a.id,a.student_id,a.status,a.version_id,a.earned_points,a.total_points,a.passed FROM test_attempts a JOIN course_tests t ON t.id=a.test_id WHERE a.id=? AND t.course_id=?", attemptId, courseId);
        List<Map<String, Object>> sections = rows("SELECT * FROM test_sections WHERE version_id=? ORDER BY sort_order", attempt.get("version_id"));
        for (Map<String, Object> section : sections) {
            section.put("snapshot", read(section.remove("snapshot_json")));
            section.put("answers", rows("SELECT question_key,selected_option_id,is_correct FROM test_answers WHERE attempt_id=? AND section_id=?", attemptId, id(section)));
            section.put("recording", rows("SELECT id,storage_url,mime_type,size_bytes FROM test_recordings WHERE attempt_id=? AND section_id=?", attemptId, id(section)));
            section.put("score", rows("SELECT earned_points,max_points,feedback,graded_at FROM test_section_scores WHERE attempt_id=? AND section_id=?", attemptId, id(section)));
        }
        attempt.put("sections", sections);
        return attempt;
    }

    public Resource recording(long attemptId, long sectionId, String email, boolean teacher) {
        if (teacher) {
            long userId = user(email);
            one("SELECT r.id FROM test_recordings r JOIN test_attempts a ON a.id=r.attempt_id JOIN course_tests t ON t.id=a.test_id JOIN users u ON u.id=? WHERE r.attempt_id=? AND r.section_id=? AND (t.created_by_teacher_id=? OR u.role='ADMIN')", userId, attemptId, sectionId, userId);
        } else studentAttempt(attemptId, email);
        String url = string(one("SELECT storage_url FROM test_recordings WHERE attempt_id=? AND section_id=?", attemptId, sectionId).get("storage_url"));
        return media.load(url);
    }

    public String recordingType(long attemptId, long sectionId) {
        return string(one("SELECT mime_type FROM test_recordings WHERE attempt_id=? AND section_id=?", attemptId, sectionId).get("mime_type"));
    }

    private String sourceMediaUrl(long attemptId, long sectionId, String kind, int index, String email) {
        Map<String, Object> attempt = studentAttempt(attemptId, email);
        Map<String, Object> section = one("SELECT snapshot_json FROM test_sections WHERE id=? AND version_id=?", sectionId, attempt.get("version_id"));
        Map<String, Object> snapshot = read(section.get("snapshot_json"));
        String url;
        if ("audio".equals(kind)) url = string(snapshot.get("audioUrl"));
        else if ("attachment".equals(kind)) {
            List<Map<String, Object>> files = (List<Map<String, Object>>) snapshot.get("attachments");
            if (files == null || index < 0 || index >= files.size()) throw new IllegalArgumentException("Tệp không thuộc Test");
            url = string(files.get(index).get("url"));
        } else throw new IllegalArgumentException("Loại tệp không hợp lệ");
        if (url == null || !url.startsWith("/uploads/")) throw new IllegalArgumentException("Tệp Test không hợp lệ");
        return url;
    }

    public Resource sourceMedia(long attemptId, long sectionId, String kind, int index, String email) {
        return media.load(sourceMediaUrl(attemptId, sectionId, kind, index, email));
    }

    public String sourceMediaType(long attemptId, long sectionId, String kind, int index, String email) {
        return media.contentType(sourceMediaUrl(attemptId, sectionId, kind, index, email));
    }

    @Transactional
    public Map<String, Object> grade(long courseId, long attemptId, long sectionId, BigDecimal score, String feedback, String email) {
        teacherCourse(courseId, email);
        long teacherId = user(email);
        Map<String, Object> attempt = one("SELECT a.* FROM test_attempts a JOIN course_tests t ON t.id=a.test_id WHERE a.id=? AND t.course_id=? FOR UPDATE", attemptId, courseId);
        if ("IN_PROGRESS".equals(attempt.get("status"))) throw new IllegalArgumentException("Học viên chưa nộp Test");
        Map<String, Object> section = one("SELECT * FROM test_sections WHERE id=? AND version_id=? AND source_type='SPEAKING'", sectionId, attempt.get("version_id"));
        if (score == null || score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(decimal(section.get("max_points"))) > 0)
            throw new IllegalArgumentException("Điểm Speaking phải nằm trong thang điểm của phần này");
        db.update("INSERT INTO test_section_scores(attempt_id,section_id,earned_points,max_points,graded_by_teacher_id,graded_at,feedback) VALUES (?,?,?,?,?,NOW(),?) ON DUPLICATE KEY UPDATE earned_points=VALUES(earned_points),graded_by_teacher_id=VALUES(graded_by_teacher_id),graded_at=NOW(),feedback=VALUES(feedback)", attemptId, sectionId, score, section.get("max_points"), teacherId, feedback);
        int ungraded = db.queryForObject("SELECT COUNT(*) FROM test_sections s LEFT JOIN test_section_scores p ON p.section_id=s.id AND p.attempt_id=? WHERE s.version_id=? AND s.source_type='SPEAKING' AND p.id IS NULL", Integer.class, attemptId, attempt.get("version_id"));
        if (ungraded == 0) {
            BigDecimal earned = decimal(one("SELECT COALESCE(SUM(earned_points),0) AS total FROM test_section_scores WHERE attempt_id=?", attemptId).get("total"));
            BigDecimal percent = earned.multiply(new BigDecimal("100")).divide(decimal(attempt.get("total_points")), 2, RoundingMode.HALF_UP);
            BigDecimal pass = decimal(one("SELECT pass_percent FROM test_versions WHERE id=?", attempt.get("version_id")).get("pass_percent"));
            db.update("UPDATE test_attempts SET status='GRADED',earned_points=?,passed=? WHERE id=?", earned, percent.compareTo(pass) >= 0, attemptId);
        }
        return Map.of("graded", true, "status", ungraded == 0 ? "GRADED" : "PENDING_GRADING");
    }
}
