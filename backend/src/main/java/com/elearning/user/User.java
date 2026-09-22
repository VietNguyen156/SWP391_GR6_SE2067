package com.elearning.user;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private UserRole role = UserRole.STUDENT;
    @Column(nullable = false, unique = true, length = 255)
    private String email;
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;
    @Column(length = 30) private String phone;
    @Column(name = "avatar_url", length = 500) private String avatarUrl;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;
    @Column(name = "email_verified_at") private LocalDateTime emailVerifiedAt;
    @Column(name = "last_login_at") private LocalDateTime lastLoginAt;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    @PrePersist void prePersist(){ createdAt=LocalDateTime.now(); updatedAt=createdAt; }
    @PreUpdate void preUpdate(){ updatedAt=LocalDateTime.now(); }

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public UserRole getRole(){return role;} public void setRole(UserRole role){this.role=role;}
    public String getEmail(){return email;} public void setEmail(String email){this.email=email;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String passwordHash){this.passwordHash=passwordHash;}
    public String getFullName(){return fullName;} public void setFullName(String fullName){this.fullName=fullName;}
    public String getPhone(){return phone;} public void setPhone(String phone){this.phone=phone;}
    public String getAvatarUrl(){return avatarUrl;} public void setAvatarUrl(String avatarUrl){this.avatarUrl=avatarUrl;}
    public UserStatus getStatus(){return status;} public void setStatus(UserStatus status){this.status=status;}
    public LocalDateTime getEmailVerifiedAt(){return emailVerifiedAt;} public void setEmailVerifiedAt(LocalDateTime v){this.emailVerifiedAt=v;}
    public LocalDateTime getLastLoginAt(){return lastLoginAt;} public void setLastLoginAt(LocalDateTime v){this.lastLoginAt=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
