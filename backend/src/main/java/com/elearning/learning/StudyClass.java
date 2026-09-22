package com.elearning.learning;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@Table(name = "classes")
public class StudyClass extends TimedEntity {
    @ManyToOne(optional=false) @JoinColumn(name="course_id") private Course course;
    @ManyToOne(optional=false) @JoinColumn(name="created_by_teacher_id") private User creator;
    @ManyToOne(optional=false) @JoinColumn(name="teacher_id") private User mentor;
    @Column(nullable=false, length=180) private String name;
    @Column(name="class_code", nullable=false, unique=true, length=50) private String classCode;
    @Column(columnDefinition="TEXT") private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxStudents;
    @Column(nullable=false, length=20) private String status = "OPEN";
}

