package elearning.controller;

import elearning.dto.AuthDto.AuthResponse;
import elearning.dto.AuthDto.ChangePasswordRequest;
import elearning.dto.AuthDto.ForgotPasswordRequest;
import elearning.dto.AuthDto.ForgotPasswordResponse;
import elearning.dto.AuthDto.LoginRequest;
import elearning.dto.AuthDto.LogoutRequest;
import elearning.dto.AuthDto.RefreshTokenRequest;
import elearning.dto.AuthDto.RegisterRequest;
import elearning.dto.AuthDto.ResetPasswordRequest;
import elearning.dto.AuthDto.VerifyResetCodeRequest;
import elearning.dto.AuthDto.UpdateProfileRequest;
import elearning.dto.AuthDto.UserResponse;
import elearning.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String ALL_ROLES = "hasAnyRole('STUDENT','TEACHER','ADMIN')";
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return service.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return service.refresh(request);
    }

    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        return service.forgot(request);
    }

    @PostMapping("/verify-reset-code")
    public Map<String, String> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        service.verifyResetCode(request);
        return Map.of("message", "Mã hợp lệ");
    }

    @PostMapping("/reset-password")
    public Map<String, String> reset(@Valid @RequestBody ResetPasswordRequest request) {
        service.reset(request);
        return Map.of("message", "Đổi mật khẩu thành công");
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@Valid @RequestBody LogoutRequest request) {
        service.logout(request);
        return Map.of("message", "Đăng xuất thành công");
    }

    @GetMapping("/me")
    @PreAuthorize(ALL_ROLES)
    public UserResponse me(Principal principal) {
        return service.me(principal.getName());
    }

    @PutMapping("/profile")
    @PreAuthorize(ALL_ROLES)
    public UserResponse updateProfile(
            Principal principal, @Valid @RequestBody UpdateProfileRequest request) {
        return service.updateProfile(principal.getName(), request);
    }

    @PutMapping("/change-password")
    @PreAuthorize(ALL_ROLES)
    public Map<String, String> changePassword(
            Principal principal, @Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(principal.getName(), request);
        return Map.of("message", "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
    }
}
