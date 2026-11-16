package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "daily_learning_statistics",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "learning_date"}))
public class DailyLearningStatistic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "learning_date", nullable = false)
    private LocalDate learningDate;

    @Column(name = "learning_minutes", nullable = false)
    private Integer learningMinutes = 0;

    @Column(name = "lessons_completed", nullable = false)
    private Integer lessonsCompleted = 0;

    @Column(name = "test_completed", nullable = false)
    private Integer testCompleted = 0;

    public Long getId() {
        return id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User v) {
        student = v;
    }

    public LocalDate getLearningDate() {
        return learningDate;
    }

    public void setLearningDate(LocalDate v) {
        learningDate = v;
    }

    public Integer getLearningMinutes() {
        return learningMinutes;
    }

    public void setLearningMinutes(Integer v) {
        learningMinutes = v;
    }

    public Integer getLessonsCompleted() {
        return lessonsCompleted;
    }

    public void setLessonsCompleted(Integer v) {
        lessonsCompleted = v;
    }

    public Integer getTestCompleted() {
        return testCompleted;
    }

    public void setTestCompleted(Integer v) {
        testCompleted = v;
    }
}
