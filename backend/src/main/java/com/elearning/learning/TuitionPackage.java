package com.elearning.learning;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@Table(name = "packages")
public class TuitionPackage extends TimedEntity {
    @ManyToOne(optional=false) @JoinColumn(name="created_by_teacher_id") private User mentor;
    @Column(nullable=false, length=180) private String name;
    @Column(columnDefinition="TEXT") private String description;
    @Column(nullable=false, precision=12, scale=2) private BigDecimal price;
    @Column(name="duration_days") private Integer durationDays;
    @Column(nullable=false, length=20) private String status = "ACTIVE";
}

