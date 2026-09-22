package com.elearning.learning;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@Table(name = "courses")
public class Course extends TimedEntity {
    @ManyToOne(optional=false) @JoinColumn(name="created_by_teacher_id") private User mentor;
    @Column(nullable=false, length=200) private String title;
    @Column(nullable=false, unique=true, length=220) private String slug;
    @Column(nullable=false, length=20) private String status = "DRAFT";
}

