package elearning.service;

import elearning.dto.AuthDto.AuthResponse;
import elearning.dto.AuthDto.ChangePasswordRequest;
import elearning.dto.AuthDto.ForgotPasswordRequest;
import elearning.dto.AuthDto.ForgotPasswordResponse;
import elearning.dto.AuthDto.LoginRequest;
import elearning.dto.AuthDto.LogoutRequest;
import elearning.dto.AuthDto.RefreshTokenRequest;
import elearning.dto.AuthDto.RegisterRequest;
import elearning.dto.AuthDto.ResetPasswordRequest;
import elearning.dto.AuthDto.UpdateProfileRequest;
import elearning.dto.AuthDto.UserResponse;
import elearning.entity.PasswordResetToken;
import elearning.entity.RefreshToken;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.PasswordResetTokenRepository;
import elearning.repository.RefreshTokenRepository;
import elearning.repository.UserRepository;
import elearning.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    static final String ACCOUNT_LOCKED_MESSAGE =
            "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final long refreshExpirationMs;
    private final boolean exposeResetToken;

    public AuthService(
            UserRepository users,
            PasswordResetTokenRepository resetTokens,
            RefreshTokenRepository refreshTokens,
            PasswordEncoder encoder,
            JwtService jwt,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs,
            @Value("${app.auth.expose-reset-token:false}") boolean exposeResetToken) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.refreshTokens = refreshTokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshExpirationMs = refreshExpirationMs;
        this.exposeResetToken = exposeResetToken;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(request.password()));
        user.setPhone(normalizeNullable(request.phone()));
        user.setRole(UserRole.STUDENT);
        user.setStatus(UserStatus.ACTIVE);
        users.save(user);
        return issueTokenPair(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user =
                users.findByEmailIgnoreCase(normalizeEmail(request.email()))
                        .orElseThrow(
                                () ->
                                        new BadCredentialsException(
                                                "Email hoặc mật khẩu không đúng"));
        if (!encoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng");
        }
        // Chỉ báo "bị khóa" khi mật khẩu đúng để không lộ email nào đang tồn tại.
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new LockedException(ACCOUNT_LOCKED_MESSAGE);
        }

        user.setLastLoginAt(LocalDateTime.now());
        users.save(user);
        return issueTokenPair(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored =
                refreshTokens
                        .findByTokenHash(hash(request.refreshToken()))
                        .orElseThrow(
                                () -> new BadCredentialsException("Refresh token không hợp lệ"));
        if (stored.getRevokedAt() != null || stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Refresh token đã hết hạn hoặc bị thu hồi");
        }
        User user = stored.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new LockedException(ACCOUNT_LOCKED_MESSAGE);
        }

        stored.setRevokedAt(LocalDateTime.now());
        refreshTokens.save(stored);
        return issueTokenPair(user);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokens
                .findByTokenHash(hash(request.refreshToken()))
                .ifPresent(
                        token -> {
                            if (token.getRevokedAt() == null) {
                                token.setRevokedAt(LocalDateTime.now());
                                refreshTokens.save(token);
                            }
                        });
    }

    @Transactional
    public ForgotPasswordResponse forgot(ForgotPasswordRequest request) {
        var user = users.findByEmailIgnoreCase(normalizeEmail(request.email()));
        if (user.isEmpty()) {
            return new ForgotPasswordResponse(
                    "Nếu email tồn tại, yêu cầu đặt lại mật khẩu đã được tạo.", null);
        }

        resetTokens.deleteAllByUserId(user.get().getId());
        String rawToken = randomToken();
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user.get());
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        resetTokens.save(token);
        return new ForgotPasswordResponse(
                "Nếu email tồn tại, yêu cầu đặt lại mật khẩu đã được tạo.",
                exposeResetToken ? rawToken : null);
    }

    @Transactional
    public void reset(ResetPasswordRequest request) {
        PasswordResetToken token =
                resetTokens
                        .findByTokenHash(hash(request.token()))
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Mã đặt lại mật khẩu không hợp lệ"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Mã đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng");
        }

        User user = token.getUser();
        user.setPasswordHash(encoder.encode(request.newPassword()));
        users.save(user);
        token.setUsedAt(LocalDateTime.now());
        resetTokens.save(token);
        revokeAllRefreshTokens(user.getId());
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = requireUser(email);
        user.setFullName(request.fullName().trim());
        user.setPhone(normalizeNullable(request.phone()));
        user.setAvatarUrl(normalizeNullable(request.avatarUrl()));
        return toResponse(users.save(user));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = requireUser(email);
        if (!encoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }
        if (encoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        user.setPasswordHash(encoder.encode(request.newPassword()));
        users.save(user);
        revokeAllRefreshTokens(user.getId());
    }

    @Transactional(readOnly = true)
    public UserResponse me(String email) {
        return toResponse(requireUser(email));
    }

    private AuthResponse issueTokenPair(User user) {
        String rawRefreshToken = randomToken();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hash(rawRefreshToken));
        refreshToken.setExpiresAt(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000));
        refreshTokens.save(refreshToken);
        return new AuthResponse(
                jwt.generateAccessToken(user),
                rawRefreshToken,
                "Bearer",
                jwt.getAccessExpirationSeconds(),
                toResponse(user));
    }

    private void revokeAllRefreshTokens(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        var activeTokens = refreshTokens.findAllByUserIdAndRevokedAtIsNull(userId);
        activeTokens.forEach(token -> token.setRevokedAt(now));
        refreshTokens.saveAll(activeTokens);
    }

    private User requireUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Tài khoản không tồn tại"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getStatus().name());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể băm token", exception);
        }
    }
}
