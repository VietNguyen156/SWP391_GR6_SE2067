package elearning.service;

import elearning.dto.GrammarDto.AttachmentResponse;
import elearning.dto.ReadingDto.ReadingRequest;
import elearning.dto.ReadingDto.ReadingResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.Course;
import elearning.entity.CourseWeek;
import elearning.entity.Lesson;
import elearning.entity.ReadingActivity;
import elearning.entity.ReadingAttachment;
import elearning.entity.ReadingOption;
import elearning.entity.ReadingQuestion;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.exception.LearningAccessException;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.CourseWeekRepository;
import elearning.repository.LessonRepository;
import elearning.repository.ReadingActivityRepository;
import elearning.repository.ReadingAttachmentRepository;
import elearning.repository.ReadingAttemptRepository;
import elearning.repository.ReadingQuestionRepository;
import elearning.repository.UserRepository;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Bài Reading: giáo viên quản lý bài, câu hỏi và tệp đính kèm; kiểm tra quyền xem tệp của học viên. */
@Service
@Transactional
public class ReadingService {
    public static final int MAX_ATTACHMENTS = 10;
    static final Set<String> FILE_TYPES =
            Set.of(".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp");
    static final String EMPTY_CONTENT =
            "Bài Reading cần có đoạn văn hoặc ít nhất một tệp đính kèm";

    private final ReadingActivityRepository activities;
    private final ReadingAttemptRepository attempts;
    private final ReadingQuestionRepository questions;
    private final ReadingAttachmentRepository attachments;
    private final CourseWeekRepository weeks;
    private final UserRepository users;
    private final LessonRepository lessons;
    private final ClassEnrollmentRepository enrollments;
    private final LessonService lessonService;
    private final MediaStorageService media;

    public ReadingService(
            ReadingActivityRepository activities,
            ReadingAttemptRepository attempts,
            ReadingQuestionRepository questions,
            ReadingAttachmentRepository attachments,
            CourseWeekRepository weeks,
            UserRepository users,
            LessonRepository lessons,
            ClassEnrollmentRepository enrollments,
            LessonService lessonService,
            MediaStorageService media) {
        this.activities = activities;
        this.attempts = attempts;
        this.questions = questions;
        this.attachments = attachments;
        this.weeks = weeks;
        this.users = users;
        this.lessons = lessons;
        this.enrollments = enrollments;
        this.lessonService = lessonService;
        this.media = media;
    }

    @Transactional(readOnly = true)
    public List<ReadingResponse> list(String email) {
        return activities.findAllByTeacherIdOrderByUpdatedAtDesc(teacher(email).getId()).stream()
                .map(a -> response(a, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReadingResponse get(String email, Long id) {
        return response(owned(id, teacher(email).getId()), true);
    }

    /**
     * Tạo bài chưa có đoạn văn → DRAFT (chờ tải tệp rồi gọi publish). Bài đã có thì luôn phải còn
     * đoạn văn hoặc tệp đính kèm.
     */
    public ReadingResponse save(String email, Long id, ReadingRequest r) {
        User t = teacher(email);
        ReadingActivity a = id == null ? new ReadingActivity() : owned(id, t.getId());
        requireNoAttempts(id);
        if (id == null) a.setTeacher(t);
        a.setCourseWeek(week(r.courseWeekId(), t.getId()));
        a.setLesson(lesson(r.lessonId(), r.courseWeekId(), t.getId()));
        a.setTitle(r.title().trim());
        a.setDescription(clean(r.description()));
        a.setInstruction(clean(r.instruction()));
        a.setPassage(clean(r.passage()));
        a.setPassageFormat(
                parse(ReadingActivity.PassageFormat.class, r.passageFormat(), ReadingActivity.PassageFormat.MARKDOWN));
        a.setToeicPart(parse(ReadingActivity.ToeicPart.class, r.toeicPart(), ReadingActivity.ToeicPart.PART_7));
        a.setPassageType(
                parse(ReadingActivity.PassageType.class, r.passageType(), ReadingActivity.PassageType.SINGLE));
        if (r.questions() == null || r.questions().isEmpty())
            throw new IllegalArgumentException("Bài Reading cần có ít nhất một câu hỏi");
        boolean hasContent = hasContent(a);
        if (id != null && !hasContent) throw new IllegalArgumentException(EMPTY_CONTENT);
        // Ẩn/hiện do khóa học và tuần quyết định; DRAFT chỉ dùng cho bài chưa có nội dung đọc.
        a.setStatus(hasContent ? ReadingActivity.Status.PUBLISHED : ReadingActivity.Status.DRAFT);
        activities.save(a);
        if (id != null) {
            for (ReadingQuestion q : questions.findAllByActivityIdOrderBySortOrderAsc(a.getId()))
                questions.delete(q);
            questions.flush();
        }
        int qi = 1;
        for (ReadingRequest.Question qr : r.questions()) {
            ReadingQuestion q = new ReadingQuestion();
            q.setActivity(a);
            q.setQuestionText(qr.questionText().trim());
            q.setExplanation(clean(qr.explanation()));
            q.setEvidence(clean(qr.evidence()));
            q.setSortOrder(qi++);
            int oi = 1;
            for (ReadingRequest.Option or : qr.options()) {
                ReadingOption o = new ReadingOption();
                o.setQuestion(q);
                o.setOptionText(or.optionText().trim());
                o.setCorrect(or.correct());
                o.setSortOrder(oi++);
                q.getOptions().add(o);
            }
            questions.save(q);
        }
        return response(a, true);
    }

    /** Hiển thị bài cho học viên: chặn nếu chưa có đoạn văn lẫn tệp đính kèm. */
    public ReadingResponse publish(String email, Long id) {
        ReadingActivity a = owned(id, teacher(email).getId());
        if (!hasContent(a)) throw new IllegalArgumentException(EMPTY_CONTENT);
        a.setStatus(ReadingActivity.Status.PUBLISHED);
        return response(activities.save(a), true);
    }

    public void delete(String email, Long id) {
        ReadingActivity a = owned(id, teacher(email).getId());
        if (attempts.existsByActivityId(id))
            throw new IllegalArgumentException(
                    "Bài Reading đã có học viên nộp nên không thể xóa. Hãy giữ bài để bảo toàn lịch sử kết quả.");
        List<ReadingAttachment> files = attachments.findAllByActivityIdOrderBySortOrderAsc(id);
        attachments.deleteAll(files);
        attachments.flush();
        activities.delete(a);
        activities.flush();
        files.forEach(this::removeUnusedFile);
    }

    // ---- Tệp đính kèm ----

    public AttachmentResponse addFile(String email, Long id, MultipartFile file, String title)
            throws IOException {
        ReadingActivity a = owned(id, teacher(email).getId());
        activities.lockById(id);
        if (attachments.countByActivityId(id) >= MAX_ATTACHMENTS)
            throw new IllegalArgumentException(
                    "Mỗi bài Reading có tối đa " + MAX_ATTACHMENTS + " tệp đính kèm");
        MediaStorageService.StoredFile stored =
                media.storeAttachment(
                        file,
                        "reading/" + id,
                        FILE_TYPES,
                        "Định dạng không được hỗ trợ. Chỉ nhận PDF, Word (DOC, DOCX) hoặc ảnh (PNG, JPG, WEBP)");
        ReadingAttachment item = new ReadingAttachment();
        item.setActivity(a);
        item.setTitle(title(title, stored.fileName()));
        item.setUrl(stored.url());
        item.setFileName(stored.fileName());
        item.setMimeType(stored.mimeType());
        item.setSizeBytes(stored.sizeBytes());
        List<ReadingAttachment> current = attachments.findAllByActivityIdOrderBySortOrderAsc(id);
        item.setSortOrder(current.isEmpty() ? 1 : current.get(current.size() - 1).getSortOrder() + 1);
        try {
            return attachmentResponse(attachments.saveAndFlush(item));
        } catch (RuntimeException e) {
            media.delete(stored.url()); // không để file mồ côi khi không lưu được bản ghi
            throw e;
        }
    }

    public AttachmentResponse renameAttachment(String email, Long attId, String title) {
        ReadingAttachment item = ownedAttachment(email, attId);
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("Tiêu đề không được để trống");
        item.setTitle(title(title, item.getTitle()));
        return attachmentResponse(attachments.save(item));
    }

    public void reorderAttachments(String email, Long id, List<Long> ids) {
        owned(id, teacher(email).getId());
        Map<Long, ReadingAttachment> byId = new HashMap<>();
        attachments.findAllByActivityIdOrderBySortOrderAsc(id).forEach(x -> byId.put(x.getId(), x));
        if (ids.size() != byId.size() || !byId.keySet().equals(new HashSet<>(ids)))
            throw new IllegalArgumentException(
                    "Danh sách tệp không khớp với bài hiện tại. Hãy tải lại trang rồi thử lại.");
        normalize(ids.stream().map(byId::get).toList());
    }

    public void deleteAttachment(String email, Long attId) {
        ReadingAttachment item = ownedAttachment(email, attId);
        ReadingActivity a = item.getActivity();
        requireNoAttempts(a.getId());
        if (a.getStatus() == ReadingActivity.Status.PUBLISHED
                && clean(a.getPassage()) == null
                && attachments.countByActivityId(a.getId()) <= 1)
            throw new IllegalArgumentException(
                    "Không thể xóa tệp cuối cùng khi bài chưa có đoạn văn. " + EMPTY_CONTENT + ".");
        attachments.delete(item);
        attachments.flush();
        removeUnusedFile(item);
        normalize(attachments.findAllByActivityIdOrderBySortOrderAsc(a.getId()));
    }

    public record AttachmentFile(Resource resource, String mimeType, String fileName) {}

    /** Học viên: bài đang hiển thị + đã vào lớp + được mở bài học. Giáo viên: chủ sở hữu. Admin: tất cả. */
    @Transactional(readOnly = true)
    public AttachmentFile attachmentFile(String email, Long attId) {
        User user =
                users.findByEmailIgnoreCase(email)
                        .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tài khoản"));
        ReadingAttachment item =
                attachments.findById(attId)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tệp"));
        ReadingActivity a = item.getActivity();
        if (user.getRole() == UserRole.STUDENT) requireStudentAccess(user, visible(a.getId()));
        else if (user.getRole() != UserRole.ADMIN && !a.getTeacher().getId().equals(user.getId()))
            throw new ContentNotFoundException("Không tìm thấy tệp");
        return new AttachmentFile(media.load(item.getUrl()), item.getMimeType(), item.getFileName());
    }

    // ---- Dùng chung với trang học viên ----

    /** Bài học viên được thấy: bài, tuần, khóa và bài học đều đang hiển thị. */
    @Transactional(readOnly = true)
    public ReadingActivity visible(Long id) {
        return activities
                .findById(id)
                .filter(x -> x.getStatus() == ReadingActivity.Status.PUBLISHED)
                .filter(
                        x ->
                                x.getCourseWeek().getStatus() == CourseWeek.Status.PUBLISHED
                                        && x.getCourseWeek().getCourse().getStatus()
                                                == Course.Status.PUBLISHED)
                .filter(
                        x ->
                                x.getLesson() == null
                                        || x.getLesson().getStatus() == Lesson.Status.PUBLISHED)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy bài Reading"));
    }

    public void requireStudentAccess(User student, ReadingActivity a) {
        Long courseId = a.getCourseWeek().getCourse().getId();
        if (!enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                student.getId(), courseId, ClassEnrollment.Status.ACTIVE))
            throw LearningAccessException.notEnrolled(
                    "Bạn cần tham gia một lớp của khóa học trước khi làm bài Reading", courseId);
        if (a.getLesson() != null) lessonService.requireStudentAccess(student, a.getLesson());
    }

    /** withKey=false (học viên trước khi nộp): ẩn đáp án đúng, giải thích và căn cứ. */
    public ReadingResponse response(ReadingActivity a, boolean withKey) {
        return new ReadingResponse(
                a.getId(),
                a.getCourseWeek().getId(),
                a.getLesson() == null ? null : a.getLesson().getId(),
                a.getTitle(),
                a.getDescription(),
                a.getInstruction(),
                a.getPassage(),
                a.getPassageFormat().name(),
                a.getToeicPart().name(),
                a.getPassageType().name(),
                a.getStatus().name(),
                questions.findAllByActivityIdOrderBySortOrderAsc(a.getId()).stream()
                        .map(
                                q ->
                                        new ReadingResponse.Question(
                                                q.getId(),
                                                q.getQuestionText(),
                                                withKey ? q.getExplanation() : null,
                                                withKey ? q.getEvidence() : null,
                                                q.getOptions().stream()
                                                        .map(
                                                                o ->
                                                                        new ReadingResponse.Option(
                                                                                o.getId(),
                                                                                o.getOptionText(),
                                                                                withKey && o.isCorrect()))
                                                        .toList()))
                        .toList(),
                attachments.findAllByActivityIdOrderBySortOrderAsc(a.getId()).stream()
                        .map(ReadingService::attachmentResponse)
                        .toList(),
                withKey && attempts.existsByActivityId(a.getId()),
                withKey ? attempts.countByActivityId(a.getId()) : 0);
    }

    static AttachmentResponse attachmentResponse(ReadingAttachment x) {
        return new AttachmentResponse(
                x.getId(),
                x.getKind().name(),
                x.getTitle(),
                x.getUrl(),
                x.getFileName(),
                x.getMimeType(),
                x.getSizeBytes());
    }

    // ---- Nội bộ ----

    private boolean hasContent(ReadingActivity a) {
        return clean(a.getPassage()) != null
                || (a.getId() != null && attachments.countByActivityId(a.getId()) > 0);
    }

    private void requireNoAttempts(Long id) {
        if (id != null && attempts.existsByActivityId(id))
            throw new IllegalArgumentException(
                    "Bài Reading đã có học viên nộp. Không thể sửa nội dung để bảo toàn kết quả; hãy tạo bài mới nếu cần thay đổi.");
    }

    private void removeUnusedFile(ReadingAttachment item) {
        if (!attachments.existsByUrl(item.getUrl())) media.delete(item.getUrl());
    }

    /** Ghi thứ tự 1..n; đẩy ra vùng tạm trước để không trùng khóa duy nhất (bài, sort_order). */
    private void normalize(List<ReadingAttachment> ordered) {
        if (ordered.isEmpty()) return;
        int temporary =
                ordered.stream().mapToInt(ReadingAttachment::getSortOrder).max().orElse(0)
                        + ordered.size()
                        + 100;
        for (ReadingAttachment item : ordered) item.setSortOrder(temporary++);
        attachments.saveAllAndFlush(ordered);
        for (int i = 0; i < ordered.size(); i++) ordered.get(i).setSortOrder(i + 1);
        attachments.saveAllAndFlush(ordered);
    }

    private ReadingAttachment ownedAttachment(String email, Long attId) {
        Long tid = teacher(email).getId();
        return attachments
                .findById(attId)
                .filter(x -> x.getActivity().getTeacher().getId().equals(tid))
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tệp đính kèm"));
    }

    private ReadingActivity owned(Long id, Long tid) {
        return activities
                .findById(id)
                .filter(a -> a.getTeacher().getId().equals(tid))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài Reading"));
    }

    private CourseWeek week(Long weekId, Long teacherId) {
        return weeks.findById(weekId)
                .filter(w -> w.getCourse().getCreatedByTeacher().getId().equals(teacherId))
                .orElseThrow(
                        () -> new IllegalArgumentException("Tuần học không thuộc khóa học của giáo viên"));
    }

    private Lesson lesson(Long lessonId, Long weekId, Long teacherId) {
        if (lessonId == null)
            throw new IllegalArgumentException("Vui lòng chọn bài học trước khi tạo bài Reading");
        Lesson lesson =
                lessons.findByIdAndCreatedByTeacherId(lessonId, teacherId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        if (lesson.getCourseWeek() == null || !lesson.getCourseWeek().getId().equals(weekId))
            throw new IllegalArgumentException("Bài học không thuộc tuần đã chọn");
        return lesson;
    }

    private User teacher(String e) {
        return users.findByEmailIgnoreCase(e)
                .filter(u -> u.getRole() == UserRole.TEACHER && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giáo viên"));
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
