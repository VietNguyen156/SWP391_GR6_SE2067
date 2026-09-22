package com.elearning.auth.dto;
import jakarta.validation.constraints.*;
public record RegisterRequest(
    @NotBlank(message="Họ tên không được để trống") String fullName,
    @NotBlank @Email(message="Email không hợp lệ") String email,
    @NotBlank @Size(min=6, message="Mật khẩu phải có ít nhất 6 ký tự") String password,
    String phone
) {}
