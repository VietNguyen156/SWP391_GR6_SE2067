package com.elearning.learning;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@Table(name = "subscriptions")
public class Subscription extends TimedEntity {
    @ManyToOne(optional=false) @JoinColumn(name="student_id") private User student;
    @ManyToOne(optional=false) @JoinColumn(name="package_id") private TuitionPackage tuitionPackage;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime activatedAt;
    @Column(nullable=false, length=20) private String status = "PENDING";
}

