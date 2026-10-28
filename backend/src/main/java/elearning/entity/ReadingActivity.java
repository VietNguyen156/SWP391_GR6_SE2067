package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Bài Reading: giống Listening nhưng thay audio bằng đoạn văn nhập trực tiếp và/hoặc tệp đính kèm
 * (reading_attachments). Phải có ít nhất một trong hai mới được hiển thị cho học viên.
 */
@Entity
@Table(name = "reading_activities")
public class ReadingActivity {
    public enum Status {
        DRAFT,
        PUBLISHED,
        HIDDEN
    }

    public enum PassageFormat {
        PLAIN,
        MARKDOWN
    }

    public enum ToeicPart {
        PART_6,
        PART_7,
        GENERAL
    }

    public enum PassageType {
        SINGLE,
        DOUBLE,
        TRIPLE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_week_id", nullable = false)
    private CourseWeek courseWeek;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    /** Đoạn văn nhập trực tiếp (Markdown đã giới hạn cú pháp, render an toàn ở frontend). */
    @Column(columnDefinition = "LONGTEXT")
    private String passage;

    @Enumerated(EnumType.STRING)
    @Column(name = "passage_format", nullable = false, length = 10)
    private PassageFormat passageFormat = PassageFormat.MARKDOWN;

    @Enumerated(EnumType.STRING)
    @Column(name = "toeic_part", nullable = false, length = 10)
    private ToeicPart toeicPart = ToeicPart.PART_7;

    @Enumerated(EnumType.STRING)
    @Column(name = "passage_type", nullable = false, length = 10)
    private PassageType passageType = PassageType.SINGLE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void pre() {
        LocalDateTime n = LocalDateTime.now();
        if (createdAt == null) createdAt = n;
        updatedAt = n;
    }

    @PreUpdate
    void upd() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CourseWeek getCourseWeek() {
        return courseWeek;
    }

    public void setCourseWeek(CourseWeek v) {
        courseWeek = v;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User v) {
        teacher = v;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson lesson) {
        this.lesson = lesson;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String v) {
        instruction = v;
    }

    public String getPassage() {
        return passage;
    }

    public void setPassage(String v) {
        passage = v;
    }

    public PassageFormat getPassageFormat() {
        return passageFormat;
    }

    public void setPassageFormat(PassageFormat v) {
        passageFormat = v;
    }

    public ToeicPart getToeicPart() {
        return toeicPart;
    }

    public void setToeicPart(ToeicPart v) {
        toeicPart = v;
    }

    public PassageType getPassageType() {
        return passageType;
    }

    public void setPassageType(PassageType v) {
        passageType = v;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status v) {
        status = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
