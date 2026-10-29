package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Hồ sơ một khoản tiền đã nhận; mỗi đơn PAID có đúng một bản ghi (kể cả đơn 0đ). */
@Entity
@Table(name = "payment_receipts")
public class PaymentReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private CourseOrder order;

    @Column(name = "received_amount", nullable = false)
    private Long receivedAmount;

    @Column(name = "bank_transaction_ref", length = 100)
    private String bankTransactionRef;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    @Column(name = "confirmed_at", nullable = false)
    private LocalDateTime confirmedAt;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    public Long getId() {
        return id;
    }

    public CourseOrder getOrder() {
        return order;
    }

    public void setOrder(CourseOrder order) {
        this.order = order;
    }

    public Long getReceivedAmount() {
        return receivedAmount;
    }

    public void setReceivedAmount(Long receivedAmount) {
        this.receivedAmount = receivedAmount;
    }

    public String getBankTransactionRef() {
        return bankTransactionRef;
    }

    public void setBankTransactionRef(String bankTransactionRef) {
        this.bankTransactionRef = bankTransactionRef;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }

    public User getConfirmedBy() {
        return confirmedBy;
    }

    public void setConfirmedBy(User confirmedBy) {
        this.confirmedBy = confirmedBy;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }
}
