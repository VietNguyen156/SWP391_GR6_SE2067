package elearning.service;

import elearning.dto.GrammarDto.AttachmentResponse;
import elearning.dto.TestBankDto.ListeningRequest;
import elearning.dto.TestBankDto.ListeningResponse;
import elearning.dto.TestBankDto.OptionView;
import elearning.dto.TestBankDto.Question;
import elearning.dto.TestBankDto.QuestionRef;
import elearning.dto.TestBankDto.QuestionSetRequest;
import elearning.dto.TestBankDto.QuestionSetResponse;
import elearning.dto.TestBankDto.QuestionView;
import elearning.dto.TestBankDto.ReadingRequest;
import elearning.dto.TestBankDto.ReadingResponse;
import elearning.dto.TestBankDto.SpeakingRequest;
import elearning.dto.TestBankDto.SpeakingResponse;
import elearning.entity.ReadingActivity;
import elearning.entity.TestBankListeningItem;
import elearning.entity.TestBankListeningOption;
import elearning.entity.TestBankListeningQuestion;
import elearning.entity.TestBankReadingAttachment;
import elearning.entity.TestBankReadingItem;
import elearning.entity.TestBankReadingOption;
import elearning.entity.TestBankReadingQuestion;
import elearning.entity.TestBankSpeakingItem;
import elearning.entity.TestBankStatus;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.TestBankListeningItemRepository;
import elearning.repository.TestBankReadingAttachmentRepository;
import elearning.repository.TestBankReadingItemRepository;
import elearning.repository.TestBankSpeakingItemRepository;
import elearning.repository.UserRepository;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Ngân hàng đề thi của giáo viên: bài Nghe, bài Đọc, đề Nói dùng riêng cho Test cuối khóa.
 * Hoàn toàn độc lập với học liệu theo tuần/bài (listening_activities, reading_activities, ...).
 */
@Service
@Transactional
public class TestBankService {
    static final String EMPTY_READING =
            "Bài Đọc cần có đoạn văn hoặc ít nhất một tệp đính kèm";

    private final TestBankListeningItemRepository listening;
    private final TestBankReadingItemRepository reading;
    private final TestBankSpeakingItemRepository speaking;
    private final TestBankReadingAttachmentRepository attachments;
    private final UserRepository users;
    private final MediaStorageService media;
    private final JdbcTemplate db;
    private final FinalTestService finalTests;

    public TestBankService(
            TestBankListeningItemRepository listening,
            TestBankReadingItemRepository reading,
            TestBankSpeakingItemRepository speaking,
            TestBankReadingAttachmentRepository attachments,
            UserRepository users,
            MediaStorageService media,
            JdbcTemplate db,
            FinalTestService finalTests) {
        this.listening = listening;
        this.reading = reading;
        this.speaking = speaking;
        this.attachments = attachments;
        this.users = users;
        this.media = media;
        this.db = db;
        this.finalTests = finalTests;
    }

    /** Sửa mục ngân hàng thì các phần Test đang dùng nó (chưa có lượt làm) cập nhật theo. */
    private void refresh(String type, Long id) {
        if (id != null) finalTests.refreshSections(type, id);
    }

    // ---- Nghe ----

    @Transactional(readOnly = true)
    public List<ListeningResponse> listListening(String email) {
        return listening.findAllByTeacherIdOrderByUpdatedAtDesc(teacher(email).getId()).stream()
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public ListeningResponse getListening(String email, Long id) {
        return response(ownedListening(id, teacher(email).getId()));
    }

    public ListeningResponse saveListening(String email, Long id, ListeningRequest r) {
        User t = teacher(email);
        TestBankListeningItem item = id == null ? new TestBankListeningItem() : ownedListening(id, t.getId());
        String audio = clean(r.audioUrl());
        if (audio == null) throw new IllegalArgumentException("Bài Nghe cần có file âm thanh");
        if (!audio.startsWith("/uploads/") || !audioExists(audio))
            throw new IllegalArgumentException("File âm thanh không tồn tại. Hãy tải lại file nghe");
        List<Question> questions = requireQuestions(r.questions(), "Bài Nghe");
        if (id == null) item.setTeacher(t);
        item.setTitle(r.title().trim());
        item.setInstruction(clean(r.instruction()));
        item.setAudioUrl(audio);
        item.getQuestions().clear();
        int qi = 1;
        for (Question qr : questions) {
            TestBankListeningQuestion q = new TestBankListeningQuestion();
            q.setItem(item);
            q.setQuestionText(qr.questionText().trim());
            q.setSortOrder(qi++);
            int oi = 1;
            for (var or : qr.options()) {
                TestBankListeningOption o = new TestBankListeningOption();
                o.setQuestion(q);
                o.setOptionText(or.optionText().trim());
                o.setCorrect(or.correct());
                o.setSortOrder(oi++);
                q.getOptions().add(o);
            }
            item.getQuestions().add(q);
        }
        TestBankListeningItem saved = listening.save(item);
        listening.flush();
        refresh("LISTENING", saved.getId());
        return response(saved);
    }

    public void deleteListening(String email, Long id) {
        TestBankListeningItem item = ownedListening(id, teacher(email).getId());
        requireUnused("source_test_listening_id", id, "Bài Nghe");
        listening.delete(item);
    }

    public ListeningResponse setListeningStatus(String email, Long id, TestBankStatus status) {
        TestBankListeningItem item = ownedListening(id, teacher(email).getId());
        item.setStatus(status);
        return response(listening.save(item));
    }

    /** Lưu file nghe của giáo viên; thư mục listening/{teacherId} cho phép chính họ nghe thử qua /api/media/listening. */
    public String uploadAudio(String email, MultipartFile audio) throws IOException {
        return media.store(audio, "listening/" + teacher(email).getId());
    }

    // ---- Đọc ----

    @Transactional(readOnly = true)
    public List<ReadingResponse> listReading(String email) {
        return reading.findAllByTeacherIdOrderByUpdatedAtDesc(teacher(email).getId()).stream()
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReadingResponse getReading(String email, Long id) {
        return response(ownedReading(id, teacher(email).getId()));
    }

    /**
     * Tạo bài chưa có đoạn văn → HIDDEN (chờ tải tệp rồi publish). Bài đã có thì luôn phải còn
     * đoạn văn hoặc tệp đính kèm.
     */
    public ReadingResponse saveReading(String email, Long id, ReadingRequest r) {
        User t = teacher(email);
        TestBankReadingItem item = id == null ? new TestBankReadingItem() : ownedReading(id, t.getId());
        List<Question> questions = requireQuestions(r.questions(), "Bài Đọc");
        String passage = clean(r.passage());
        boolean hasContent = passage != null || (id != null && attachments.countByItemId(id) > 0);
        if (id != null && !hasContent) throw new IllegalArgumentException(EMPTY_READING);
        requireEvidenceInPassage(questions, passage);
        if (id == null) {
            item.setTeacher(t);
            item.setStatus(hasContent ? TestBankStatus.ACTIVE : TestBankStatus.HIDDEN);
        }
        item.setTitle(r.title().trim());
        item.setInstruction(clean(r.instruction()));
        item.setPassage(passage);
        item.setPassageFormat(parse(ReadingActivity.PassageFormat.class, r.passageFormat(), ReadingActivity.PassageFormat.MARKDOWN));
        item.setToeicPart(parse(ReadingActivity.ToeicPart.class, r.toeicPart(), ReadingActivity.ToeicPart.PART_7));
        item.setPassageType(parse(ReadingActivity.PassageType.class, r.passageType(), ReadingActivity.PassageType.SINGLE));
        item.getQuestions().clear();
        int qi = 1;
        for (Question qr : questions) {
            TestBankReadingQuestion q = new TestBankReadingQuestion();
            q.setItem(item);
            q.setQuestionText(qr.questionText().trim());
            q.setExplanation(clean(qr.explanation()));
            q.setEvidence(clean(qr.evidence()));
            q.setSortOrder(qi++);
            int oi = 1;
            for (var or : qr.options()) {
                TestBankReadingOption o = new TestBankReadingOption();
                o.setQuestion(q);
                o.setOptionText(or.optionText().trim());
                o.setCorrect(or.correct());
                o.setSortOrder(oi++);
                q.getOptions().add(o);
            }
            item.getQuestions().add(q);
        }
        TestBankReadingItem saved = reading.save(item);
        reading.flush();
        refresh("READING", saved.getId());
        return response(saved);
    }

    public ReadingResponse setReadingStatus(String email, Long id, TestBankStatus status) {
        TestBankReadingItem item = ownedReading(id, teacher(email).getId());
        if (status == TestBankStatus.ACTIVE && !hasContent(item))
            throw new IllegalArgumentException(EMPTY_READING);
        item.setStatus(status);
        return response(reading.save(item));
    }

    public void deleteReading(String email, Long id) {
        TestBankReadingItem item = ownedReading(id, teacher(email).getId());
        requireUnused("source_test_reading_id", id, "Bài Đọc");
        List<TestBankReadingAttachment> files = attachments.findAllByItemIdOrderBySortOrderAsc(id);
        reading.delete(item);
        reading.flush();
        files.forEach(this::removeUnusedFile);
    }

    public AttachmentResponse addFile(String email, Long id, MultipartFile file, String title)
            throws IOException {
        TestBankReadingItem item = ownedReading(id, teacher(email).getId());
        if (attachments.countByItemId(id) >= ReadingService.MAX_ATTACHMENTS)
            throw new IllegalArgumentException(
                    "Mỗi bài Đọc có tối đa " + ReadingService.MAX_ATTACHMENTS + " tệp đính kèm");
        MediaStorageService.StoredFile stored =
                media.storeAttachment(
                        file,
                        "test-bank/reading/" + id,
                        ReadingService.FILE_TYPES,
                        "Định dạng không được hỗ trợ. Chỉ nhận PDF, Word (DOC, DOCX) hoặc ảnh (PNG, JPG, WEBP)");
        TestBankReadingAttachment a = new TestBankReadingAttachment();
        a.setItem(item);
        a.setTitle(title(title, stored.fileName()));
        a.setUrl(stored.url());
        a.setFileName(stored.fileName());
        a.setMimeType(stored.mimeType());
        a.setSizeBytes(stored.sizeBytes());
        List<TestBankReadingAttachment> current = attachments.findAllByItemIdOrderBySortOrderAsc(id);
        a.setSortOrder(current.isEmpty() ? 1 : current.get(current.size() - 1).getSortOrder() + 1);
        try {
            AttachmentResponse response = attachmentResponse(attachments.saveAndFlush(a));
            refresh("READING", id);
            return response;
        } catch (RuntimeException e) {
            media.delete(stored.url());
            throw e;
        }
    }

    public AttachmentResponse renameAttachment(String email, Long attId, String title) {
        TestBankReadingAttachment a = ownedAttachment(email, attId);
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("Tiêu đề không được để trống");
        a.setTitle(title(title, a.getTitle()));
        return attachmentResponse(attachments.save(a));
    }

    public void reorderAttachments(String email, Long id, List<Long> ids) {
        ownedReading(id, teacher(email).getId());
        Map<Long, TestBankReadingAttachment> byId = new HashMap<>();
        attachments.findAllByItemIdOrderBySortOrderAsc(id).forEach(x -> byId.put(x.getId(), x));
        if (ids.size() != byId.size() || !byId.keySet().equals(new HashSet<>(ids)))
            throw new IllegalArgumentException(
                    "Danh sách tệp không khớp với bài hiện tại. Hãy tải lại trang rồi thử lại.");
        normalize(ids.stream().map(byId::get).toList());
    }

    public void deleteAttachment(String email, Long attId) {
        TestBankReadingAttachment a = ownedAttachment(email, attId);
        TestBankReadingItem item = a.getItem();
        if (item.getStatus() == TestBankStatus.ACTIVE
                && clean(item.getPassage()) == null
                && attachments.countByItemId(item.getId()) <= 1)
            throw new IllegalArgumentException(
                    "Không thể xóa tệp cuối cùng khi bài chưa có đoạn văn. " + EMPTY_READING + ".");
        attachments.delete(a);
        attachments.flush();
        removeUnusedFile(a);
        normalize(attachments.findAllByItemIdOrderBySortOrderAsc(item.getId()));
        refresh("READING", item.getId());
    }

    public record AttachmentFile(Resource resource, String mimeType, String fileName) {}

    @Transactional(readOnly = true)
    public AttachmentFile attachmentFile(String email, Long attId) {
        TestBankReadingAttachment a = ownedAttachment(email, attId);
        return new AttachmentFile(media.load(a.getUrl()), a.getMimeType(), a.getFileName());
    }

    // ---- Nói ----

    @Transactional(readOnly = true)
    public List<SpeakingResponse> listSpeaking(String email) {
        return speaking.findAllByTeacherIdOrderByUpdatedAtDesc(teacher(email).getId()).stream()
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public SpeakingResponse getSpeaking(String email, Long id) {
        return response(ownedSpeaking(id, teacher(email).getId()));
    }

    public SpeakingResponse saveSpeaking(String email, Long id, SpeakingRequest r) {
        User t = teacher(email);
        TestBankSpeakingItem item = id == null ? new TestBankSpeakingItem() : ownedSpeaking(id, t.getId());
        if (r.instruction() == null || r.instruction().isBlank())
            throw new IllegalArgumentException("Đề Nói cần có hướng dẫn làm bài");
        if (id == null) item.setTeacher(t);
        item.setTitle(r.title().trim());
        item.setInstruction(r.instruction().trim());
        item.setPromptText(clean(r.promptText()));
        TestBankSpeakingItem saved = speaking.save(item);
        speaking.flush();
        refresh("SPEAKING", saved.getId());
        return response(saved);
    }

    public void deleteSpeaking(String email, Long id) {
        TestBankSpeakingItem item = ownedSpeaking(id, teacher(email).getId());
        requireUnused("source_test_speaking_id", id, "Đề Nói");
        speaking.delete(item);
    }

    public SpeakingResponse setSpeakingStatus(String email, Long id, TestBankStatus status) {
        TestBankSpeakingItem item = ownedSpeaking(id, teacher(email).getId());
        item.setStatus(status);
        return response(speaking.save(item));
    }

    // ---- Bộ đề (nhiều câu hỏi) ----

    @Transactional(readOnly = true)
    public List<QuestionSetResponse> listQuestionSets(String email) {
        long tid = teacher(email).getId();
        return db.queryForList(
                        "SELECT id FROM test_bank_question_sets WHERE created_by_teacher_id=? ORDER BY updated_at DESC, id DESC",
                        Long.class,
                        tid)
                .stream()
                .map(this::questionSet)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionSetResponse getQuestionSet(String email, Long id) {
        requireOwnedSet(id, teacher(email).getId());
        return questionSet(id);
    }

    public QuestionSetResponse saveQuestionSet(String email, Long id, QuestionSetRequest r) {
        long tid = teacher(email).getId();
        String title = r.title() == null ? "" : r.title().trim();
        if (title.isEmpty()) throw new IllegalArgumentException("Cần nhập tên bộ đề");
        List<Long> ids = r.questionIds();
        if (ids == null || ids.isEmpty())
            throw new IllegalArgumentException("Bộ đề cần có ít nhất một câu hỏi");
        if (new HashSet<>(ids).size() != ids.size())
            throw new IllegalArgumentException("Bộ đề có câu hỏi bị chọn trùng");
        requireSetQuestions(ids, tid);
        long setId;
        if (id == null) {
            var keys = new GeneratedKeyHolder();
            db.update(
                    con -> {
                        PreparedStatement ps =
                                con.prepareStatement(
                                        "INSERT INTO test_bank_question_sets(created_by_teacher_id,title,description) VALUES (?,?,?)",
                                        Statement.RETURN_GENERATED_KEYS);
                        ps.setLong(1, tid);
                        ps.setString(2, title);
                        ps.setString(3, clean(r.description()));
                        return ps;
                    },
                    keys);
            setId = keys.getKey().longValue();
        } else {
            requireOwnedSet(id, tid);
            setId = id;
            db.update(
                    "UPDATE test_bank_question_sets SET title=?, description=? WHERE id=?",
                    title,
                    clean(r.description()),
                    setId);
            db.update("DELETE FROM test_bank_question_set_items WHERE set_id=?", setId);
        }
        int order = 1;
        for (Long questionId : ids)
            db.update(
                    "INSERT INTO test_bank_question_set_items(set_id,question_id,sort_order) VALUES (?,?,?)",
                    setId,
                    questionId,
                    order++);
        refresh("QUESTION_SET", setId);
        return questionSet(setId);
    }

    public QuestionSetResponse setQuestionSetStatus(String email, Long id, TestBankStatus status) {
        requireOwnedSet(id, teacher(email).getId());
        db.update("UPDATE test_bank_question_sets SET status=? WHERE id=?", status.name(), id);
        return questionSet(id);
    }

    public void deleteQuestionSet(String email, Long id) {
        requireOwnedSet(id, teacher(email).getId());
        requireUnused("source_test_question_set_id", id, "Bộ đề");
        db.update("DELETE FROM test_bank_question_sets WHERE id=?", id);
    }

    private void requireOwnedSet(Long id, Long tid) {
        Integer owned =
                db.queryForObject(
                        "SELECT COUNT(*) FROM test_bank_question_sets WHERE id=? AND created_by_teacher_id=?",
                        Integer.class,
                        id,
                        tid);
        if (owned == null || owned == 0) throw new IllegalArgumentException("Không tìm thấy bộ đề");
    }

    /** Mỗi câu phải thuộc giáo viên, còn hoạt động, đủ đáp án và không có file nghe riêng (chưa hỗ trợ trong bộ đề). */
    private void requireSetQuestions(List<Long> ids, Long tid) {
        int n = 0;
        for (Long questionId : ids) {
            n++;
            var rows =
                    db.queryForList(
                            "SELECT q.audio_url, (SELECT COUNT(*) FROM answer_options o WHERE o.question_id=q.id) AS options, "
                                    + "(SELECT COUNT(*) FROM answer_options o WHERE o.question_id=q.id AND o.is_correct=1) AS correct "
                                    + "FROM questions q WHERE q.id=? AND q.created_by_teacher_id=? AND q.status='ACTIVE'",
                            questionId,
                            tid);
            if (rows.isEmpty())
                throw new IllegalArgumentException("Câu " + n + " không còn trong ngân hàng câu hỏi của bạn");
            var row = rows.get(0);
            if (((Number) row.get("options")).intValue() < 2 || ((Number) row.get("correct")).intValue() != 1)
                throw new IllegalArgumentException(
                        "Câu " + n + " cần ít nhất hai đáp án và đúng một đáp án đúng");
            Object audio = row.get("audio_url");
            if (audio != null && !audio.toString().isBlank())
                throw new IllegalArgumentException(
                        "Câu " + n + " có file nghe riêng nên chưa dùng được trong bộ đề; hãy dùng bài Nghe");
        }
    }

    private QuestionSetResponse questionSet(Long id) {
        var header =
                db.queryForMap(
                        "SELECT title, description, status FROM test_bank_question_sets WHERE id=?", id);
        List<QuestionRef> questions =
                db.query(
                        "SELECT q.id, q.question_text FROM test_bank_question_set_items i JOIN questions q ON q.id=i.question_id WHERE i.set_id=? ORDER BY i.sort_order",
                        (rs, row) -> new QuestionRef(rs.getLong("id"), rs.getString("question_text")),
                        id);
        return new QuestionSetResponse(
                id,
                header.get("title").toString(),
                header.get("description") == null ? null : header.get("description").toString(),
                header.get("status").toString(),
                questions,
                usedBy("source_test_question_set_id", id));
    }

    // ---- Nội bộ ----

    private boolean audioExists(String url) {
        try {
            return media.load(url).exists();
        } catch (IllegalArgumentException missing) {
            return false;
        }
    }

    /** Mỗi câu có ≥ 2 đáp án và đúng một đáp án đúng (kiểm lại ở service, không chỉ ở DTO). */
    private static List<Question> requireQuestions(List<Question> questions, String what) {
        if (questions == null || questions.isEmpty())
            throw new IllegalArgumentException(what + " cần có ít nhất một câu hỏi");
        int n = 0;
        for (Question q : questions) {
            n++;
            if (q == null || q.questionText() == null || q.questionText().isBlank())
                throw new IllegalArgumentException("Câu " + n + " chưa có nội dung");
            if (q.options() == null
                    || q.options().size() < 2
                    || q.options().stream().anyMatch(o -> o == null || o.optionText() == null || o.optionText().isBlank()))
                throw new IllegalArgumentException("Câu " + n + " cần ít nhất hai đáp án có nội dung");
            if (q.options().stream().filter(o -> o.correct()).count() != 1)
                throw new IllegalArgumentException("Câu " + n + " phải có đúng một đáp án đúng");
        }
        return questions;
    }

    /** Căn cứ (evidence) phải nằm nguyên văn trong đoạn văn; bài chỉ có tệp thì không có gì để đối chiếu. */
    static void requireEvidenceInPassage(List<Question> questions, String passage) {
        if (passage == null) return;
        String haystack = plain(passage);
        int n = 0;
        for (Question q : questions) {
            n++;
            String evidence = clean(q.evidence());
            if (evidence != null && !haystack.contains(plain(evidence)))
                throw new IllegalArgumentException(
                        "Căn cứ của câu " + n + " phải nằm nguyên văn trong đoạn văn");
        }
    }

    /** Chữ thuần của Markdown (bỏ ký hiệu đậm/nghiêng/liên kết/bảng) và gộp khoảng trắng, như khi hiển thị. */
    static String plain(String text) {
        return text.replaceAll("!?\\[([^\\]]*)\\]\\([^)]*\\)", "$1")
                .replaceAll("(?m)^\\s*(#{1,6}|>|[-*+])\\s+", "")
                .replaceAll("[*`~|]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean hasContent(TestBankReadingItem item) {
        return clean(item.getPassage()) != null || attachments.countByItemId(item.getId()) > 0;
    }

    private void requireUnused(String column, Long id, String what) {
        Integer used = db.queryForObject("SELECT COUNT(*) FROM test_sections WHERE " + column + "=?", Integer.class, id);
        if (used != null && used > 0)
            throw new IllegalArgumentException(
                    what + " đang được dùng trong Test cuối khóa nên không thể xóa.");
    }

    private long usedBy(String column, Long id) {
        Long used = db.queryForObject("SELECT COUNT(*) FROM test_sections WHERE " + column + "=?", Long.class, id);
        return used == null ? 0 : used;
    }

    /** Không xóa tệp còn được bài Đọc học liệu hoặc mục khác của ngân hàng tham chiếu (media.delete còn kiểm tra snapshot Test). */
    private void removeUnusedFile(TestBankReadingAttachment a) {
        Integer others =
                db.queryForObject(
                        "SELECT (SELECT COUNT(*) FROM test_bank_reading_attachments WHERE url=?) + (SELECT COUNT(*) FROM reading_attachments WHERE url=?)",
                        Integer.class,
                        a.getUrl(),
                        a.getUrl());
        if (others == null || others == 0) media.delete(a.getUrl());
    }

    /** Ghi thứ tự 1..n; đẩy ra vùng tạm trước để không trùng khóa duy nhất (mục, sort_order). */
    private void normalize(List<TestBankReadingAttachment> ordered) {
        if (ordered.isEmpty()) return;
        int temporary =
                ordered.stream().mapToInt(TestBankReadingAttachment::getSortOrder).max().orElse(0)
                        + ordered.size()
                        + 100;
        for (TestBankReadingAttachment a : ordered) a.setSortOrder(temporary++);
        attachments.saveAllAndFlush(ordered);
        for (int i = 0; i < ordered.size(); i++) ordered.get(i).setSortOrder(i + 1);
        attachments.saveAllAndFlush(ordered);
    }

    private TestBankReadingAttachment ownedAttachment(String email, Long attId) {
        Long tid = teacher(email).getId();
        return attachments
                .findById(attId)
                .filter(x -> x.getItem().getTeacher().getId().equals(tid))
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tệp đính kèm"));
    }

    private TestBankListeningItem ownedListening(Long id, Long tid) {
        return listening
                .findById(id)
                .filter(x -> x.getTeacher().getId().equals(tid))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài Nghe trong ngân hàng"));
    }

    private TestBankReadingItem ownedReading(Long id, Long tid) {
        return reading
                .findById(id)
                .filter(x -> x.getTeacher().getId().equals(tid))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài Đọc trong ngân hàng"));
    }

    private TestBankSpeakingItem ownedSpeaking(Long id, Long tid) {
        return speaking
                .findById(id)
                .filter(x -> x.getTeacher().getId().equals(tid))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề Nói trong ngân hàng"));
    }

    private User teacher(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.TEACHER && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giáo viên"));
    }

    private ListeningResponse response(TestBankListeningItem x) {
        return new ListeningResponse(
                x.getId(),
                x.getTitle(),
                x.getInstruction(),
                x.getAudioUrl(),
                x.getStatus().name(),
                x.getQuestions().stream()
                        .map(
                                q ->
                                        new QuestionView(
                                                q.getId(),
                                                q.getQuestionText(),
                                                null,
                                                null,
                                                q.getOptions().stream()
                                                        .map(o -> new OptionView(o.getId(), o.getOptionText(), o.isCorrect()))
                                                        .toList()))
                        .toList(),
                usedBy("source_test_listening_id", x.getId()));
    }

    private ReadingResponse response(TestBankReadingItem x) {
        return new ReadingResponse(
                x.getId(),
                x.getTitle(),
                x.getInstruction(),
                x.getPassage(),
                x.getPassageFormat().name(),
                x.getToeicPart().name(),
                x.getPassageType().name(),
                x.getStatus().name(),
                x.getQuestions().stream()
                        .map(
                                q ->
                                        new QuestionView(
                                                q.getId(),
                                                q.getQuestionText(),
                                                q.getExplanation(),
                                                q.getEvidence(),
                                                q.getOptions().stream()
                                                        .map(o -> new OptionView(o.getId(), o.getOptionText(), o.isCorrect()))
                                                        .toList()))
                        .toList(),
                attachments.findAllByItemIdOrderBySortOrderAsc(x.getId()).stream()
                        .map(TestBankService::attachmentResponse)
                        .toList(),
                usedBy("source_test_reading_id", x.getId()));
    }

    private SpeakingResponse response(TestBankSpeakingItem x) {
        return new SpeakingResponse(
                x.getId(),
                x.getTitle(),
                x.getInstruction(),
                x.getPromptText(),
                x.getStatus().name(),
                usedBy("source_test_speaking_id", x.getId()));
    }

    static AttachmentResponse attachmentResponse(TestBankReadingAttachment x) {
        return new AttachmentResponse(
                x.getId(), x.getKind().name(), x.getTitle(), x.getUrl(), x.getFileName(), x.getMimeType(), x.getSizeBytes());
    }

    private static <E extends Enum<E>> E parse(Class<E> type, String value, E fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Giá trị không hợp lệ: " + value);
        }
    }

    private static String title(String value, String fallback) {
        String text = value == null || value.isBlank() ? fallback : value.trim();
        if (text == null || text.isBlank()) text = "Tài liệu";
        return text.length() > 200 ? text.substring(0, 200) : text;
    }

    private static String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
