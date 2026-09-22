package com.elearning.learning;

import com.elearning.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@Table(name = "payments")
public class Payment extends TimedEntity {
    @OneToOne(optional=false) @JoinColumn(name="subscription_id") private Subscription subscription;
    @ManyToOne(optional=false) @JoinColumn(name="student_id") private User student;
    @Column(nullable=false, precision=12, scale=2) private BigDecimal amount;
    @Column(nullable=false, length=30) private String paymentMethod = "BANK_TRANSFER";
    @Column(nullable=false, length=20) private String status = "PENDING";
    private LocalDateTime paidAt;
    private LocalDateTime confirmedAt;
    @ManyToOne @JoinColumn(name="confirmed_by_admin_id") private User confirmedBy;
}

