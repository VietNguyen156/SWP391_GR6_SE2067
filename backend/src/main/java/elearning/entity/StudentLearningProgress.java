package elearning.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "student_learning_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"}))
public class StudentLearningProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "completed_lessons", nullable = false)
    private Integer completedLessons = 0;

    @Column(name = "total_lessons", nullable = false)
    private Integer totalLessons = 0;

    @Column(name = "progress_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Column(name = "last_learning_time")
    private LocalDateTime lastLearningTime;

    public Long getId() {
        return id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User v) {
        student = v;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course v) {
        course = v;
    }

    public Integer getCompletedLessons() {
        return completedLessons;
    }

    public void setCompletedLessons(Integer v) {
        completedLessons = v;
    }

    public Integer getTotalLessons() {
        return totalLessons;
    }

    public void setTotalLessons(Integer v) {
        totalLessons = v;
    }

    public BigDecimal getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(BigDecimal v) {
        progressPercentage = v;
    }

    public LocalDateTime getLastLearningTime() {
        return lastLearningTime;
    }

    public void setLastLearningTime(LocalDateTime v) {
        lastLearningTime = v;
    }
}
