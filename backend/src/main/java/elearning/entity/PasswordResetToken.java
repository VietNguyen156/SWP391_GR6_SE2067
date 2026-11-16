package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Mã OTP 6 số đặt lại mật khẩu. Chỉ lưu giá trị băm (HMAC) của mã, không lưu mã gốc. Mã 6 số không
 * duy nhất giữa các người dùng nên {@code tokenHash} không có ràng buộc UNIQUE; mỗi người dùng chỉ
 * có một mã còn hiệu lực (mã mới thay mã cũ).
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    /** Số lần nhập sai mã này; đủ giới hạn thì mã bị vô hiệu. */
    @Column(nullable = false)
    private int attempts;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String v) {
        tokenHash = v;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime v) {
        expiresAt = v;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime v) {
        usedAt = v;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int v) {
        attempts = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime v) {
        createdAt = v;
    }
}
