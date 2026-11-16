package elearning.dto;

import jakarta.validation.constraints.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDto {
    private AuthDto() {}

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresIn,
            UserResponse user) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Mật khẩu hiện tại không được để trống") String currentPassword,
            @NotBlank(message = "Mật khẩu mới không được để trống")
                    @Size(min = 8, max = 72, message = "Mật khẩu mới phải có từ 8 đến 72 ký tự")
                    String newPassword) {}

    public record ForgotPasswordRequest(@NotBlank @Email String email) {}

    public record ForgotPasswordResponse(String message) {}

    public record LoginRequest(
            @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ")
                    String email,
            @NotBlank(message = "Mật khẩu không được để trống") String password) {}

    public record LogoutRequest(
            @NotBlank(message = "Refresh token không được để trống") String refreshToken) {}

    public record RefreshTokenRequest(
            @NotBlank(message = "Refresh token không được để trống") String refreshToken) {}

    public record RegisterRequest(
            @NotBlank(message = "Họ tên không được để trống") String fullName,
            @NotBlank @Email(message = "Email không hợp lệ") String email,
            @NotBlank @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự")
                    String password,
            @Size(max = 30, message = "Số điện thoại không được vượt quá 30 ký tự") String phone) {}

    public record VerifyResetCodeRequest(
            @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ")
                    String email,
            @NotBlank(message = "Mã xác nhận không được để trống")
                    @Pattern(regexp = "\\d{6}", message = "Mã xác nhận gồm đúng 6 chữ số")
                    String code) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ")
                    String email,
            @NotBlank(message = "Mã xác nhận không được để trống")
                    @Pattern(regexp = "\\d{6}", message = "Mã xác nhận gồm đúng 6 chữ số")
                    String code,
            @NotBlank(message = "Mật khẩu mới không được để trống")
                    @Size(min = 8, max = 72, message = "Mật khẩu mới phải có từ 8 đến 72 ký tự")
                    String newPassword) {}

    public record UpdateProfileRequest(
            @NotBlank(message = "Họ tên không được để trống")
                    @Size(max = 150, message = "Họ tên không được vượt quá 150 ký tự")
                    String fullName,
            @Size(max = 30, message = "Số điện thoại không được vượt quá 30 ký tự") String phone,
            @Size(max = 500, message = "Đường dẫn ảnh đại diện không được vượt quá 500 ký tự")
                    String avatarUrl) {}

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String role,
            String phone,
            String avatarUrl,
            String status) {}
}
