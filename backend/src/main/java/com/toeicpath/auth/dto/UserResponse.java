package com.toeicpath.auth.dto;

import com.toeicpath.user.User;
import com.toeicpath.user.UserRole;
import com.toeicpath.user.UserStatus;

public record UserResponse(Long id, String email, String fullName, UserRole role, UserStatus status) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getStatus());
    }
}