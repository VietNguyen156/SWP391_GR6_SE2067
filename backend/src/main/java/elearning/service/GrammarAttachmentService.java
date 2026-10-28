package elearning.service;

import elearning.dto.GrammarDto.AttachmentResponse;
import elearning.entity.GrammarAttachment;
import elearning.entity.GrammarContent;
import elearning.entity.GrammarTopic;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.GrammarAttachmentRepository;
import elearning.repository.GrammarContentRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Giáo viên (chủ sở hữu chủ đề) hoặc admin quản lý tệp / link đính kèm của từng phần giải thích. */
@Service
@Transactional
public class GrammarAttachmentService {
    public static final int MAX_PER_CONTENT = 10;

    private final GrammarAttachmentRepository attachments;
    private final GrammarTopicRepository topics;
    private final GrammarContentRepository contents;
    private final UserRepository users;
    private final MediaStorageService media;

    public GrammarAttachmentService(
            GrammarAttachmentRepository attachments,
            GrammarTopicRepository topics,
            GrammarContentRepository contents,
            UserRepository users,
            MediaStorageService media) {
        this.attachments = attachments;
        this.topics = topics;
        this.contents = contents;
        this.users = users;
        this.media = media;
    }

    public AttachmentResponse addFile(String email, Long contentId, MultipartFile file, String title)
            throws IOException {
        GrammarContent content = lockedContent(email, contentId);
        GrammarTopic topic = content.getGrammarTopic();
        requireRoom(contentId);
        MediaStorageService.StoredFile stored =
                media.storeAttachment(file, "grammar/" + topic.getId());
        GrammarAttachment item = new GrammarAttachment();
        item.setGrammarTopic(topic);
        item.setGrammarContent(content);
        item.setKind(GrammarAttachment.Kind.FILE);
        item.setTitle(title(title, stored.fileName()));
        item.setUrl(stored.url());
        item.setFileName(stored.fileName());
        item.setMimeType(stored.mimeType());
        item.setSizeBytes(stored.sizeBytes());
        item.setSortOrder(nextOrder(contentId));
        try {
            return response(attachments.saveAndFlush(item));
        } catch (RuntimeException e) {
            media.delete(stored.url()); // không để file mồ côi khi không lưu được bản ghi
            throw e;
        }
    }

    public AttachmentResponse addLink(String email, Long contentId, String title, String url) {
        GrammarContent content = lockedContent(email, contentId);
        requireRoom(contentId);
        String clean = validLink(url);
        GrammarAttachment item = new GrammarAttachment();
        item.setGrammarTopic(content.getGrammarTopic());
        item.setGrammarContent(content);
        item.setKind(GrammarAttachment.Kind.LINK);
        item.setTitle(title(title, URI.create(clean).getHost()));
        item.setUrl(clean);
        item.setSortOrder(nextOrder(contentId));
        return response(attachments.saveAndFlush(item));
    }

    public AttachmentResponse update(String email, Long id, String title, String url) {
        GrammarAttachment item = managedAttachment(email, id);
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("Tiêu đề không được để trống");
        item.setTitle(title(title, item.getTitle()));
        if (item.getKind() == GrammarAttachment.Kind.LINK && url != null) item.setUrl(validLink(url));
        return response(attachments.save(item));
    }

    /** Sắp xếp lại theo đúng thứ tự `ids` (phải đủ và đúng các tệp của phần giải thích). */
    public void reorder(String email, Long contentId, List<Long> ids) {
        managedContent(email, contentId);
        Map<Long, GrammarAttachment> byId = new HashMap<>();
        attachments.findAllByGrammarContentIdOrderBySortOrderAsc(contentId)
                .forEach(item -> byId.put(item.getId(), item));
        if (ids.size() != byId.size() || !byId.keySet().equals(new HashSet<>(ids)))
            throw new IllegalArgumentException(
                    "Danh sách tài liệu không khớp với phần giải thích hiện tại. Hãy tải lại trang rồi thử lại.");
        normalize(ids.stream().map(byId::get).toList());
    }

    public void delete(String email, Long id) {
        GrammarAttachment item = managedAttachment(email, id);
        Long contentId = item.getGrammarContent().getId();
        attachments.delete(item);
        attachments.flush();
        removeUnusedFile(item);
        normalize(attachments.findAllByGrammarContentIdOrderBySortOrderAsc(contentId));
    }

    /** Sau khi đã xóa bản ghi: xóa file vật lý nếu không còn bản ghi nào dùng nó. */
    void removeUnusedFile(GrammarAttachment item) {
        if (item.getKind() == GrammarAttachment.Kind.FILE && !attachments.existsByUrl(item.getUrl()))
            media.delete(item.getUrl());
    }

    public static AttachmentResponse response(GrammarAttachment a) {
        return new AttachmentResponse(
                a.getId(),
                a.getKind().name(),
                a.getTitle(),
                a.getUrl(),
                a.getFileName(),
                a.getMimeType(),
                a.getSizeBytes());
    }

    static String validLink(String url) {
        String value = url == null ? "" : url.trim();
        if (value.isEmpty()) throw new IllegalArgumentException("Vui lòng nhập đường dẫn");
        if (value.length() > 1000) throw new IllegalArgumentException("Đường dẫn tối đa 1000 ký tự");
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if ((scheme.equals("http") || scheme.equals("https")) && uri.getHost() != null)
                return value;
        } catch (java.net.URISyntaxException ignored) {
            // rơi xuống báo lỗi chung
        }
        throw new IllegalArgumentException("Đường dẫn phải bắt đầu bằng http:// hoặc https://");
    }

    private void requireRoom(Long contentId) {
        if (attachments.countByGrammarContentId(contentId) >= MAX_PER_CONTENT)
            throw new IllegalArgumentException(
                    "Mỗi phần giải thích có tối đa " + MAX_PER_CONTENT + " tài liệu đính kèm");
    }

    private int nextOrder(Long contentId) {
        List<GrammarAttachment> current =
                attachments.findAllByGrammarContentIdOrderBySortOrderAsc(contentId);
        return current.isEmpty() ? 1 : current.get(current.size() - 1).getSortOrder() + 1;
    }

    /** Ghi thứ tự 1..n; đẩy ra vùng tạm trước để không trùng khóa duy nhất (topic, sort_order). */
    private void normalize(List<GrammarAttachment> ordered) {
        if (ordered.isEmpty()) return;
        int temporary =
                ordered.stream().mapToInt(GrammarAttachment::getSortOrder).max().orElse(0)
                        + ordered.size()
                        + 100;
        for (GrammarAttachment item : ordered) item.setSortOrder(temporary++);
        attachments.saveAllAndFlush(ordered);
        for (int i = 0; i < ordered.size(); i++) ordered.get(i).setSortOrder(i + 1);
        attachments.saveAllAndFlush(ordered);
    }

    private static String title(String value, String fallback) {
        String text = value == null || value.isBlank() ? fallback : value.trim();
        if (text == null || text.isBlank()) text = "Tài liệu";
        return text.length() > 200 ? text.substring(0, 200) : text;
    }

    private GrammarContent managedContent(String email, Long contentId) {
        User user = manager(email);
        return contents.findById(contentId)
                .filter(content -> canManage(user, content.getGrammarTopic()))
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy phần giải thích"));
    }

    /** Như managedContent nhưng khóa dòng chủ đề đến hết giao dịch (hai lần thêm cùng lúc chạy lần lượt). */
    private GrammarContent lockedContent(String email, Long contentId) {
        GrammarContent content = managedContent(email, contentId);
        topics.lockById(content.getGrammarTopic().getId());
        return content;
    }

    private GrammarAttachment managedAttachment(String email, Long id) {
        User user = manager(email);
        return attachments.findById(id)
                .filter(item -> canManage(user, item.getGrammarTopic()))
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tài liệu đính kèm"));
    }

    static boolean canManage(User user, GrammarTopic topic) {
        return user.getRole() == UserRole.ADMIN
                || (topic.getCreatedByTeacher() != null
                        && topic.getCreatedByTeacher().getId().equals(user.getId()));
    }

    private User manager(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .filter(u -> u.getRole() == UserRole.TEACHER || u.getRole() == UserRole.ADMIN)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy tài khoản"));
    }
}
