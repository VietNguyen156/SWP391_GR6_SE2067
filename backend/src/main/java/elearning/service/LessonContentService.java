package elearning.service;

import elearning.dto.CourseDto.LessonContentRequest;
import elearning.dto.CourseDto.LessonContentResponse;
import elearning.entity.Lesson;
import elearning.entity.LessonContent;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ResourceNotFoundException;
import elearning.repository.LessonContentRepository;
import elearning.repository.LessonRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class LessonContentService {
    private final LessonContentRepository contents;
    private final LessonRepository lessons;
    private final UserRepository users;

    public LessonContentService(
            LessonContentRepository contents, LessonRepository lessons, UserRepository users) {
        this.contents = contents;
        this.lessons = lessons;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<LessonContentResponse> list(String email, Long lessonId) {
        User teacher = requireTeacher(email);
        ownedLesson(lessonId, teacher.getId());
        return contents.findAllByLessonIdOrderBySortOrderAsc(lessonId).stream()
                .map(LessonContentService::response)
                .toList();
    }

    public LessonContentResponse create(String email, Long lessonId, LessonContentRequest request) {
        User teacher = requireTeacher(email);
        Lesson lesson = ownedLesson(lessonId, teacher.getId());
        List<LessonContent> existing = contents.findAllByLessonIdOrderBySortOrderAsc(lessonId);
        LessonContent content = new LessonContent();
        content.setLesson(lesson);
        content.setCreatedByTeacher(teacher);
        content.setSortOrder(
                existing.stream().mapToInt(LessonContent::getSortOrder).max().orElse(0) + 1);
        apply(content, request);
        contents.save(content);
        return response(content);
    }

    public LessonContentResponse update(String email, Long id, LessonContentRequest request) {
        User teacher = requireTeacher(email);
        LessonContent content = ownedContent(id, teacher.getId());
        apply(content, request);
        contents.save(content);
        return response(content);
    }

    public void delete(String email, Long id) {
        User teacher = requireTeacher(email);
        LessonContent content = ownedContent(id, teacher.getId());
        Long lessonId = content.getLesson().getId();
        contents.delete(content);
        contents.flush();
        normalize(contents.findAllByLessonIdOrderBySortOrderAsc(lessonId));
    }

    /** Sắp xếp lại bài giảng trong bài theo đúng thứ tự `ids` (phải đủ và đúng các bài giảng). */
    public void reorder(String email, Long lessonId, List<Long> ids) {
        User teacher = requireTeacher(email);
        ownedLesson(lessonId, teacher.getId());
        Map<Long, LessonContent> byId = new HashMap<>();
        contents.findAllByLessonIdOrderBySortOrderAsc(lessonId)
                .forEach(item -> byId.put(item.getId(), item));
        if (ids.size() != byId.size() || !byId.keySet().equals(new HashSet<>(ids))) {
            throw new IllegalArgumentException(
                    "Danh sách bài giảng không khớp với bài học hiện tại. Hãy tải lại trang rồi thử lại.");
        }
        normalize(ids.stream().map(byId::get).toList());
    }

    /** Ghi thứ tự 1..n theo thứ tự danh sách; đẩy ra vùng tạm trước để không trùng khóa duy nhất. */
    private void normalize(List<LessonContent> ordered) {
        if (ordered.isEmpty()) return;
        int temporary =
                ordered.stream().mapToInt(LessonContent::getSortOrder).max().orElse(0)
                        + ordered.size()
                        + 100;
        for (LessonContent item : ordered) item.setSortOrder(temporary++);
        contents.saveAllAndFlush(ordered);
        for (int i = 0; i < ordered.size(); i++) ordered.get(i).setSortOrder(i + 1);
        contents.saveAllAndFlush(ordered);
    }

    private void apply(LessonContent content, LessonContentRequest request) {
        String body = clean(request.body());
        String resourceUrl = clean(request.resourceUrl());
        if (request.contentType() == LessonContent.Type.TEXT && body == null) {
            throw new IllegalArgumentException("Nội dung TEXT không được để trống");
        }
        if (request.contentType() != LessonContent.Type.TEXT && resourceUrl == null) {
            throw new IllegalArgumentException("Đường dẫn tài nguyên không được để trống");
        }
        content.setContentType(request.contentType());
        content.setTitle(clean(request.title()));
        content.setBody(body);
        content.setResourceUrl(resourceUrl);
        // Ẩn/hiện chỉ còn ở khóa học và tuần; bài và học liệu luôn hiển thị.
        content.setStatus(LessonContent.Status.ACTIVE);
    }

    static LessonContentResponse response(LessonContent content) {
        return new LessonContentResponse(
                content.getId(),
                content.getLesson().getId(),
                content.getContentType().name(),
                content.getTitle(),
                content.getBody(),
                content.getResourceUrl(),
                content.getSortOrder(),
                content.getStatus().name(),
                content.getCreatedAt(),
                content.getUpdatedAt());
    }

    private User requireTeacher(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        user ->
                                user.getRole() == UserRole.TEACHER
                                        && user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy tài khoản giáo viên"));
    }

    private Lesson ownedLesson(Long id, Long teacherId) {
        return lessons.findByIdAndCreatedByTeacherId(id, teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học"));
    }

    private LessonContent ownedContent(Long id, Long teacherId) {
        return contents.findByIdAndLessonCreatedByTeacherId(id, teacherId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy nội dung bài học"));
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
