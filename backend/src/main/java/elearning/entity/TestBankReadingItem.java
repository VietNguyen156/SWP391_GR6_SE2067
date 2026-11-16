package elearning.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Bài Đọc dùng riêng cho Test cuối khóa; không gắn với khóa học, tuần hay bài học. */
@Entity
@Table(name = "test_bank_reading_items")
public class TestBankReadingItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_teacher_id", nullable = false)
    private User teacher;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    @Column(columnDefinition = "LONGTEXT")
    private String passage;

    @Enumerated(EnumType.STRING)
    @Column(name = "passage_format", nullable = false, length = 20)
    private ReadingActivity.PassageFormat passageFormat = ReadingActivity.PassageFormat.MARKDOWN;

    @Enumerated(EnumType.STRING)
    @Column(name = "toeic_part", nullable = false, length = 20)
    private ReadingActivity.ToeicPart toeicPart = ReadingActivity.ToeicPart.PART_7;

    @Enumerated(EnumType.STRING)
    @Column(name = "passage_type", nullable = false, length = 20)
    private ReadingActivity.PassageType passageType = ReadingActivity.PassageType.SINGLE;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<TestBankReadingQuestion> questions = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TestBankStatus status = TestBankStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getTeacher() { return teacher; }
    public void setTeacher(User v) { teacher = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
    public String getInstruction() { return instruction; }
    public void setInstruction(String v) { instruction = v; }
    public TestBankStatus getStatus() { return status; }
    public void setStatus(TestBankStatus v) { status = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getPassage() { return passage; }
    public void setPassage(String v) { passage = v; }
    public ReadingActivity.PassageFormat getPassageFormat() { return passageFormat; }
    public void setPassageFormat(ReadingActivity.PassageFormat v) { passageFormat = v; }
    public ReadingActivity.ToeicPart getToeicPart() { return toeicPart; }
    public void setToeicPart(ReadingActivity.ToeicPart v) { toeicPart = v; }
    public ReadingActivity.PassageType getPassageType() { return passageType; }
    public void setPassageType(ReadingActivity.PassageType v) { passageType = v; }
    public List<TestBankReadingQuestion> getQuestions() { return questions; }
}
