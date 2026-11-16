package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "speaking_activities")
public class SpeakingActivity {
    public enum Status {
        DRAFT,
        PUBLISHED,
        HIDDEN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_week_id")
    private CourseWeek courseWeek;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_teacher_id")
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String instruction;

    @Column(name = "prompt_text", columnDefinition = "TEXT")
    private String promptText;

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

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String v) {
        instruction = v;
    }

    public String getPromptText() {
        return promptText;
    }

    public void setPromptText(String v) {
        promptText = v;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status v) {
        status = v;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
