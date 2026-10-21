package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Tệp hoặc link đính kèm của một phần giải thích Ngữ pháp (thay cho bài giảng video / PDF / link cũ).
 * grammar_topic_id giữ lại để kiểm tra quyền và dọn file khi xóa cả chủ đề.
 */
@Entity
@Table(name = "grammar_attachments")
public class GrammarAttachment {
    public enum Kind {
        FILE,
        LINK
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grammar_topic_id", nullable = false)
    private GrammarTopic grammarTopic;

    /** Phần giải thích chứa tài liệu (tài liệu hiện ngay dưới phần đó). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grammar_content_id", nullable = false)
    private GrammarContent grammarContent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Kind kind;

    @Column(nullable = false, length = 200)
    private String title;

    /** FILE: đường dẫn nội bộ /uploads/...; LINK: URL http(s) bên ngoài. */
    @Column(nullable = false, length = 1000)
    private String url;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GrammarTopic getGrammarTopic() {
        return grammarTopic;
    }

    public void setGrammarTopic(GrammarTopic grammarTopic) {
        this.grammarTopic = grammarTopic;
    }

    public GrammarContent getGrammarContent() {
        return grammarContent;
    }

    public void setGrammarContent(GrammarContent grammarContent) {
        this.grammarContent = grammarContent;
    }

    public Kind getKind() {
        return kind;
    }

    public void setKind(Kind kind) {
        this.kind = kind;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
