package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

@Entity
@Table(name = "course_orders")
public class CourseOrder {
    /**
     * Trạng thái đơn và các bước chuyển hợp lệ — nguồn duy nhất cho mọi thao tác đổi trạng thái.
     * EXPIRED vẫn xác nhận được (chuyển khoản muộn); AWAITING_CONFIRMATION không tự hết hạn.
     */
    public enum Status {
        PENDING,
        AWAITING_CONFIRMATION,
        PAID,
        REJECTED,
        CANCELLED,
        EXPIRED;

        public Set<Status> next() {
            return switch (this) {
                case PENDING -> EnumSet.of(AWAITING_CONFIRMATION, PAID, REJECTED, CANCELLED, EXPIRED);
                case AWAITING_CONFIRMATION -> EnumSet.of(PAID, REJECTED);
                case EXPIRED -> EnumSet.of(PAID, REJECTED);
                case PAID, REJECTED, CANCELLED -> EnumSet.noneOf(Status.class);
            };
        }

        public boolean canMoveTo(Status target) {
            return next().contains(target);
        }

        /** Đơn đang mở: chưa thanh toán xong, chưa đóng. */
        public boolean isOpen() {
            return this == PENDING || this == AWAITING_CONFIRMATION;
        }
    }

    public enum PaymentMethod {
        BANK_TRANSFER,
        FREE,
        MIGRATED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 16)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** Giá tại thời điểm tạo đơn (đồng) — không đọc lại courses.price về sau. */
    @Column(nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Status status = Status.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod = PaymentMethod.BANK_TRANSFER;

    @Column(name = "transfer_content", nullable = false, length = 40)
    private String transferContent;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "student_reported_at")
    private LocalDateTime studentReportedAt;

    @Column(name = "student_note", columnDefinition = "TEXT")
    private String studentNote;

    @Column(name = "proof_url", length = 500)
    private String proofUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransferContent() {
        return transferContent;
    }

    public void setTransferContent(String transferContent) {
        this.transferContent = transferContent;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getStudentReportedAt() {
        return studentReportedAt;
    }

    public void setStudentReportedAt(LocalDateTime studentReportedAt) {
        this.studentReportedAt = studentReportedAt;
    }

    public String getStudentNote() {
        return studentNote;
    }

    public void setStudentNote(String studentNote) {
        this.studentNote = studentNote;
    }

    public String getProofUrl() {
        return proofUrl;
    }

    public void setProofUrl(String proofUrl) {
        this.proofUrl = proofUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
