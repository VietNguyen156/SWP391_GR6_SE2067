package elearning.service;

import elearning.dto.GrammarDto.GrammarContentRequest;
import elearning.dto.GrammarDto.GrammarContentResponse;
import elearning.dto.GrammarDto.GrammarTopicRequest;
import elearning.dto.GrammarDto.GrammarTopicResponse;
import elearning.dto.GrammarDto.GrammarTopicSummaryResponse;
import elearning.entity.GrammarAttachment;
import elearning.entity.GrammarContent;
import elearning.entity.ClassEnrollment;
import elearning.entity.GrammarTopic;
import elearning.entity.Lesson;
import elearning.entity.StudentGrammarProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.exception.LearningAccessException;
import elearning.repository.CourseWeekRepository;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.GrammarAttachmentRepository;
import elearning.repository.GrammarContentRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.LessonRepository;
import elearning.repository.StudentGrammarProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional
public class GrammarService {
    private final GrammarTopicRepository topics;
    private final GrammarContentRepository contents;
    private final StudentGrammarProgressRepository progress;
    private final UserRepository users;
    private final CourseWeekRepository weeks;
    private final LessonRepository lessons;
    private final ClassEnrollmentRepository enrollments;
    private final LessonService lessonService;
    private final GrammarAttachmentRepository attachments;
    private final MediaStorageService media;

    public GrammarService(
            GrammarTopicRepository t,
            GrammarContentRepository c,
            StudentGrammarProgressRepository p,
            UserRepository u,
            CourseWeekRepository w,
            LessonRepository l,
            ClassEnrollmentRepository e,
            LessonService ls,
            GrammarAttachmentRepository a,
            MediaStorageService m) {
        topics = t;
        contents = c;
        progress = p;
        users = u;
        weeks = w;
        lessons = l;
        enrollments = e;
        lessonService = ls;
        attachments = a;
        media = m;
    }

    public GrammarTopicResponse createTopic(String email, GrammarTopicRequest request) {
        User teacher = teacher(email);
        GrammarTopic topic = new GrammarTopic();
        topic.setCreatedByTeacher(teacher);
        applyTopic(topic, request);
        topic.setCourseWeek(weekOwnedByTeacher(request.courseWeekId(), teacher.getId()));
        topic.setLesson(lessonOwnedByTeacher(request.lessonId(), request.courseWeekId(), teacher.getId()));
        topics.save(topic);
        return response(topic, null);
    }

    public GrammarTopicResponse updateTopic(String email, Long id, GrammarTopicRequest request) {
        User teacher = teacher(email);
        GrammarTopic topic = ownedTopic(id, teacher.getId());
        applyTopic(topic, request);
        topic.setCourseWeek(weekOwnedByTeacher(request.courseWeekId(), teacher.getId()));
        topic.setLesson(lessonOwnedByTeacher(request.lessonId(), request.courseWeekId(), teacher.getId()));
        topics.save(topic);
        return response(topic, null);
    }

    public void deleteTopic(String email, Long id) {
        User t = teacher(email);
        GrammarTopic topic = ownedTopic(id, t.getId());
        if (progress.existsByGrammarTopicId(id)) {
            throw new IllegalArgumentException(
                    "Chủ đề ngữ pháp đã có học viên học nên không thể xóa. Hãy giữ chủ đề để bảo toàn tiến độ của học viên.");
        }
        // Xóa bản ghi đính kèm trước (đã nạp vào phiên Hibernate nên không để khóa ngoại tự xóa), sau đó
        // dọn file không còn bản ghi nào dùng.
        List<GrammarAttachment> all = attachments.findAllByGrammarTopicIdOrderBySortOrderAsc(id);
        List<GrammarAttachment> files =
                all.stream().filter(a -> a.getKind() == GrammarAttachment.Kind.FILE).toList();
        attachments.deleteAll(all);
        attachments.flush();
        topics.delete(topic);
        topics.flush();
        files.stream()
                .map(GrammarAttachment::getUrl)
                .distinct()
                .filter(url -> !attachments.existsByUrl(url))
                .forEach(media::delete);
    }

    public record AttachmentFile(org.springframework.core.io.Resource resource, String mimeType, String fileName) {}

    /**
     * Xem / tải tệp đính kèm. Admin và giáo viên chủ sở hữu luôn xem được; học viên phải có quyền
     * với bài chứa chủ đề (cùng luật mở bài như trang Ngữ pháp). Không có quyền → 403/404.
     */
    @Transactional(readOnly = true)
    public AttachmentFile attachmentFile(String email, Long attachmentId) {
        User user =
                users.findByEmailIgnoreCase(email)
                        .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tài khoản"));
        GrammarAttachment item =
                attachments.findById(attachmentId)
                        .filter(a -> a.getKind() == GrammarAttachment.Kind.FILE)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tài liệu"));
        GrammarTopic topic = item.getGrammarTopic();
        if (user.getRole() == UserRole.STUDENT) requireTopicAccess(user, topic);
        else if (!GrammarAttachmentService.canManage(user, topic))
            throw new ContentNotFoundException("Không tìm thấy tài liệu");
        return new AttachmentFile(media.load(item.getUrl()), item.getMimeType(), item.getFileName());
    }

    public GrammarContentResponse addContent(
            String email, Long topicId, GrammarContentRequest request) {
        User t = teacher(email);
        GrammarTopic topic = ownedTopic(topicId, t.getId());
        GrammarContent content = new GrammarContent();
        content.setGrammarTopic(topic);
        applyContent(content, request, null);
        contents.save(content);
        return contentResponse(content);
    }

    public GrammarContentResponse updateContent(
            String email, Long id, GrammarContentRequest request) {
        User t = teacher(email);
        GrammarContent content = ownedContent(id, t.getId());
        applyContent(content, request, id);
        contents.save(content);
        return contentResponse(content);
    }

    public void deleteContent(String email, Long id) {
        User t = teacher(email);
        GrammarContent content = ownedContent(id, t.getId());
        // Xóa tài liệu của phần này trước (đã nạp vào phiên Hibernate), rồi xóa phần, rồi dọn file không còn dùng.
        List<GrammarAttachment> all = attachments.findAllByGrammarContentIdOrderBySortOrderAsc(id);
        List<String> files =
                all.stream()
                        .filter(a -> a.getKind() == GrammarAttachment.Kind.FILE)
                        .map(GrammarAttachment::getUrl)
                        .distinct()
                        .toList();
        attachments.deleteAll(all);
        attachments.flush();
        contents.delete(content);
        contents.flush();
        files.stream().filter(url -> !attachments.existsByUrl(url)).forEach(media::delete);
    }

    @Transactional(readOnly = true)
    public List<GrammarTopicSummaryResponse> teacherTopics(String email) {
        User t = teacher(email);
        return topics.findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(t.getId()).stream()
                .map(x -> summary(x, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public GrammarTopicResponse teacherTopic(String email, Long id) {
        User t = teacher(email);
        return response(ownedTopic(id, t.getId()), null);
    }

    @Transactional(readOnly = true)
    public GrammarTopicResponse studentTopic(String email, Long id) {
        User student = student(email);
        GrammarTopic topic =
                topics.findByIdAndStatus(id, GrammarTopic.Status.PUBLISHED)
                        .orElseThrow(
                                () ->
                                        new ContentNotFoundException(
                                                "Không tìm thấy chủ đề ngữ pháp"));
        requireTopicAccess(student, topic);
        return response(
                topic, progress.findByStudentIdAndGrammarTopicId(student.getId(), id).orElse(null));
    }

    private void applyTopic(GrammarTopic topic, GrammarTopicRequest r) {
        topic.setTitle(r.title().trim());
        topic.setDescription(clean(r.description()));
        topic.setLevel(r.level() == null ? GrammarTopic.Level.BEGINNER : r.level());
        // Ẩn/hiện chỉ còn ở khóa học và tuần; bài và học liệu luôn hiển thị.
        topic.setStatus(GrammarTopic.Status.PUBLISHED);
    }

    private void applyContent(GrammarContent c, GrammarContentRequest r, Long currentId) {
        Integer order = r.sortOrder();
        if (order == null)
            order =
                    contents.findTopByGrammarTopicIdOrderBySortOrderDesc(
                                    c.getGrammarTopic().getId())
                            .map(x -> x.getSortOrder() + 1)
                            .orElse(1);
        boolean duplicate =
                currentId == null
                        ? contents.existsByGrammarTopicIdAndSortOrder(
                                c.getGrammarTopic().getId(), order)
                        : contents.existsByGrammarTopicIdAndSortOrderAndIdNot(
                                c.getGrammarTopic().getId(), order, currentId);
        if (duplicate) throw new IllegalArgumentException("Thứ tự nội dung đã tồn tại");
        c.setRuleContent(r.ruleContent().trim());
        c.setExamples(clean(r.examples()));
        c.setNotes(clean(r.notes()));
        c.setSortOrder(order);
    }

    private GrammarTopicSummaryResponse summary(GrammarTopic t, StudentGrammarProgress p) {
        return new GrammarTopicSummaryResponse(
                t.getId(),
                t.getCourseWeek() == null ? null : t.getCourseWeek().getId(),
                t.getLesson() == null ? null : t.getLesson().getId(),
                t.getTitle(),
                t.getDescription(),
                t.getLevel().name(),
                t.getStatus().name(),
                contents.findAllByGrammarTopicIdOrderBySortOrderAsc(t.getId()).size(),
                p == null ? StudentGrammarProgress.Status.NOT_STARTED.name() : p.getStatus().name(),
                p == null ? BigDecimal.ZERO : p.getProgressPercent(),
                inUse(t));
    }

    private boolean inUse(GrammarTopic t) {
        return t.getId() != null && progress.existsByGrammarTopicId(t.getId());
    }

    private GrammarTopicResponse response(GrammarTopic t, StudentGrammarProgress p) {
        return new GrammarTopicResponse(
                t.getId(),
                t.getCreatedByTeacher() == null ? null : t.getCreatedByTeacher().getId(),
                t.getCourseWeek() == null ? null : t.getCourseWeek().getId(),
                t.getLesson() == null ? null : t.getLesson().getId(),
                t.getTitle(),
                t.getDescription(),
                t.getLevel().name(),
                t.getStatus().name(),
                contents.findAllByGrammarTopicIdOrderBySortOrderAsc(t.getId()).stream()
                        .map(this::contentResponse)
                        .toList(),
                p == null ? StudentGrammarProgress.Status.NOT_STARTED.name() : p.getStatus().name(),
                p == null ? BigDecimal.ZERO : p.getProgressPercent(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                inUse(t));
    }

    private GrammarContentResponse contentResponse(GrammarContent c) {
        return new GrammarContentResponse(
                c.getId(),
                c.getRuleContent(),
                c.getExamples(),
                c.getNotes(),
                c.getSortOrder(),
                c.getCreatedAt(),
                c.getId() == null
                        ? List.of()
                        : attachments.findAllByGrammarContentIdOrderBySortOrderAsc(c.getId()).stream()
                                .map(GrammarAttachmentService::response)
                                .toList());
    }

    /** Ném lỗi kèm lý do thật: 404 khi nháp/không tồn tại, 403 khi chưa ghi danh hoặc bài bị khóa. */
    private void requireTopicAccess(User student, GrammarTopic topic) {
        if (topic.getStatus() != GrammarTopic.Status.PUBLISHED
                || topic.getCourseWeek() == null
                || topic.getCourseWeek().getStatus() != elearning.entity.CourseWeek.Status.PUBLISHED
                || topic.getCourseWeek().getCourse().getStatus()
                        != elearning.entity.Course.Status.PUBLISHED) {
            throw new ContentNotFoundException("Không tìm thấy chủ đề ngữ pháp");
        }
        if (topic.getLesson() != null) {
            lessonService.requireStudentAccess(student, topic.getLesson());
            return;
        }
        Long courseId = topic.getCourseWeek().getCourse().getId();
        if (!enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                student.getId(), courseId, ClassEnrollment.Status.ACTIVE)) {
            throw LearningAccessException.notEnrolled(
                    "Bạn cần tham gia một lớp của khóa học trước khi học chủ đề này", courseId);
        }
    }

    private GrammarTopic ownedTopic(Long id, Long teacherId) {
        return topics.findByIdAndCreatedByTeacherId(id, teacherId)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy chủ đề ngữ pháp"));
    }

    private GrammarContent ownedContent(Long id, Long teacherId) {
        return contents.findById(id)
                .filter(
                        c ->
                                c.getGrammarTopic().getCreatedByTeacher() != null
                                        && c.getGrammarTopic()
                                                .getCreatedByTeacher()
                                                .getId()
                                                .equals(teacherId))
                .orElseThrow(
                        () -> new ContentNotFoundException("Không tìm thấy nội dung ngữ pháp"));
    }

    private User teacher(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.TEACHER && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy giáo viên"));
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));
    }

    private elearning.entity.CourseWeek weekOwnedByTeacher(Long id, Long teacherId) {
        if (id == null) throw new IllegalArgumentException("Vui lòng chọn tuần học");
        return weeks.findById(id)
                .filter(w -> w.getCourse().getCreatedByTeacher().getId().equals(teacherId))
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Tuần học không thuộc khóa học của giáo viên"));
    }

    private Lesson lessonOwnedByTeacher(Long lessonId, Long weekId, Long teacherId) {
        if (lessonId == null) {
            throw new IllegalArgumentException("Vui lòng chọn bài học trước khi tạo học liệu");
        }
        Lesson lesson =
                lessons.findByIdAndCreatedByTeacherId(lessonId, teacherId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        if (lesson.getCourseWeek() == null || !lesson.getCourseWeek().getId().equals(weekId)) {
            throw new IllegalArgumentException("Bài học không thuộc tuần đã chọn");
        }
        return lesson;
    }

    private String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
