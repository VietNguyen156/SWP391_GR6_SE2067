package elearning.entity;

import jakarta.persistence.*;

/** Tệp đính kèm của bài Đọc trong ngân hàng (PDF, Word, ảnh). */
@Entity
@Table(name = "test_bank_reading_attachments")
public class TestBankReadingAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private TestBankReadingItem item;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private GrammarAttachment.Kind kind = GrammarAttachment.Kind.FILE;

    @Column(nullable = false, length = 200)
    private String title;

    /** Đường dẫn nội bộ /uploads/...; giáo viên xem qua /api/teacher/test-bank/reading/attachments/{id}/file. */
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

    public Long getId() { return id; }
    public TestBankReadingItem getItem() { return item; }
    public void setItem(TestBankReadingItem v) { item = v; }
    public GrammarAttachment.Kind getKind() { return kind; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
    public String getUrl() { return url; }
    public void setUrl(String v) { url = v; }
    public String getFileName() { return fileName; }
    public void setFileName(String v) { fileName = v; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String v) { mimeType = v; }
    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long v) { sizeBytes = v; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer v) { sortOrder = v; }
}
