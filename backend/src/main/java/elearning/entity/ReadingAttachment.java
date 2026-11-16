package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Tệp đính kèm của bài Reading (PDF, Word, ảnh) — cùng khuôn với grammar_attachments, chỉ dùng FILE. */
@Entity
@Table(name = "reading_attachments")
public class ReadingAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reading_activity_id", nullable = false)
    private ReadingActivity activity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private GrammarAttachment.Kind kind = GrammarAttachment.Kind.FILE;

    @Column(nullable = false, length = 200)
    private String title;

    /** Đường dẫn nội bộ /uploads/reading/...; xem / tải qua /api/reading/attachments/{id}/file. */
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

    public ReadingActivity getActivity() {
        return activity;
    }

    public void setActivity(ReadingActivity activity) {
        this.activity = activity;
    }

    public GrammarAttachment.Kind getKind() {
        return kind;
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
}
