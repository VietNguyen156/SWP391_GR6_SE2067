package com.elearning.learning;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@Table(name = "class_enrollments", uniqueConstraints=@UniqueConstraint(columnNames={"class_id","student_id"}))
public class Enrollment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="class_id") private StudyClass studyClass;
    @ManyToOne(optional=false) @JoinColumn(name="student_id") private User student;
    @Column(nullable=false) private LocalDateTime enrolledAt = LocalDateTime.now();
    @Column(nullable=false, length=20) private String status = "ACTIVE";
}

