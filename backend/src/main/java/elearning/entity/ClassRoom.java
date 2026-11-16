package elearning.entity;

import jakarta.persistence.*;

import java.time.*;

@Entity
@Table(name = "classes")
public class ClassRoom {
    /** Nháp → Đang mở (nhận học viên) → Đã kết thúc; hoặc Đã hủy. */
    public enum Status {
        DRAFT,
        OPEN,
        COMPLETED,
        CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_teacher_id", nullable = false)
    private User createdByTeacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(name = "name", nullable = false, length = 180)
    private String className;

    @Column(name = "class_code", nullable = false, unique = true, length = 50)
    private String classCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "max_students")
    private Integer maxStudents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course v) {
        course = v;
    }

    public User getCreatedByTeacher() {
        return createdByTeacher;
    }

    public void setCreatedByTeacher(User v) {
        createdByTeacher = v;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User v) {
        teacher = v;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String v) {
        className = v;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String v) {
        classCode = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate v) {
        startDate = v;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate v) {
        endDate = v;
    }

    public Integer getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(Integer v) {
        maxStudents = v;
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
