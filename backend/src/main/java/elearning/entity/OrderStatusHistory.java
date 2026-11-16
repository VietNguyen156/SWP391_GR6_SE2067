package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Một lần đổi trạng thái đơn hàng. changedBy null = do hệ thống (hết hạn tự động, chuyển đổi dữ liệu). */
@Entity
@Table(name = "order_status_history")
public class OrderStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CourseOrder order;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private CourseOrder.Status fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private CourseOrder.Status toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public CourseOrder getOrder() {
        return order;
    }

    public void setOrder(CourseOrder order) {
        this.order = order;
    }

    public CourseOrder.Status getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(CourseOrder.Status fromStatus) {
        this.fromStatus = fromStatus;
    }

    public CourseOrder.Status getToStatus() {
        return toStatus;
    }

    public void setToStatus(CourseOrder.Status toStatus) {
        this.toStatus = toStatus;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(User changedBy) {
        this.changedBy = changedBy;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
