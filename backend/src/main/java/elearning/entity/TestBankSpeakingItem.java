package elearning.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Đề Nói dùng riêng cho Test cuối khóa; không gắn với khóa học, tuần hay bài học. */
@Entity
@Table(name = "test_bank_speaking_items")
public class TestBankSpeakingItem {
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

    @Column(name = "prompt_text", columnDefinition = "TEXT")
    private String promptText;

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
    public String getPromptText() { return promptText; }
    public void setPromptText(String v) { promptText = v; }
}
