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
import elearning.dto.AuthDto.VerifyResetCodeRequest;
import elearning.dto.AuthDto.UpdateProfileRequest;
import elearning.dto.AuthDto.UserResponse;
import elearning.entity.PasswordResetToken;
import elearning.entity.RefreshToken;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.TooManyRequestsException;
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
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    /** Mã OTP đặt lại mật khẩu: hiệu lực, số lần nhập sai tối đa, khoảng cách giữa hai lần xin mã. */
    static final int RESET_CODE_MINUTES = 10;
    static final int RESET_MAX_ATTEMPTS = 5;
    static final int RESET_RESEND_SECONDS = 60;
    static final String FORGOT_MESSAGE =
            "Nếu email tồn tại, mã xác nhận đã được gửi. Mã có hiệu lực trong "
                    + RESET_CODE_MINUTES
                    + " phút.";
    static final String RESET_INVALID_MESSAGE = "Mã không hợp lệ hoặc đã hết hạn";
    static final String RESET_TOO_MANY_MESSAGE =
            "Bạn đã nhập sai quá số lần cho phép, hãy yêu cầu mã mới";
    static final String ACCOUNT_LOCKED_MESSAGE =
            "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final long refreshExpirationMs;
    private final EmailService mail;
    private final byte[] resetCodeKey;
    private final Clock clock;
    /**
     * Lần xin mã gần nhất theo email (epoch ms), áp dụng cho MỌI email (kể cả không tồn tại) để lỗi 429
     * không làm lộ tài khoản. ponytail: bộ nhớ của một tiến trình; chạy nhiều bản backend thì chuyển sang DB/Redis.
     */
    private final Map<String, Long> lastForgotAt = new ConcurrentHashMap<>();

    public AuthService(
            UserRepository users,
            PasswordResetTokenRepository resetTokens,
            RefreshTokenRepository refreshTokens,
            PasswordEncoder encoder,
            JwtService jwt,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs,
            EmailService mail,
            @Value("${app.auth.reset-code-secret}") String resetCodeSecret,
            Clock clock) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.refreshTokens = refreshTokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshExpirationMs = refreshExpirationMs;
        this.mail = mail;
        this.resetCodeKey = resetCodeSecret.getBytes(StandardCharsets.UTF_8);
        this.clock = clock;
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

    /**
     * Quên mật khẩu: tạo mã OTP 6 số, lưu băm HMAC và gửi email. Luôn trả cùng một thông báo dù email có
     * tồn tại hay không; chỉ gửi mail khi tài khoản tồn tại và đang ACTIVE. Xin mã quá dày thì 429 (cùng
     * quy tắc cho mọi email).
     */
    @Transactional
    public ForgotPasswordResponse forgot(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        throttleForgot(email);

        var found = users.findByEmailIgnoreCase(email);
        if (found.isEmpty() || found.get().getStatus() != UserStatus.ACTIVE) {
            return new ForgotPasswordResponse(FORGOT_MESSAGE);
        }
        User user = found.get();
        // Mã mới vô hiệu mã cũ của người dùng này.
        resetTokens.deleteAllByUserId(user.getId());
        String code = randomCode();
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(codeHash(user.getId(), code));
        token.setExpiresAt(LocalDateTime.now(clock).plusMinutes(RESET_CODE_MINUTES));
        token.setCreatedAt(LocalDateTime.now(clock));
        resetTokens.save(token);
        // Bất đồng bộ; lỗi gửi chỉ ghi log và không đổi phản hồi.
        mail.sendResetCode(user.getEmail(), code, RESET_CODE_MINUTES);
        return new ForgotPasswordResponse(FORGOT_MESSAGE);
    }

    /**
     * Đặt lại mật khẩu bằng email + mã 6 số. noRollbackFor: lần nhập sai vẫn phải lưu (tăng attempts) dù
     * ném lỗi cho client.
     */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void reset(ResetPasswordRequest request) {
        PasswordResetToken token = checkResetCode(request.email(), request.code());
        User user = token.getUser();
        user.setPasswordHash(encoder.encode(request.newPassword()));
        users.save(user);
        token.setUsedAt(LocalDateTime.now(clock));
        resetTokens.save(token);
        revokeAllRefreshTokens(user.getId());
    }

    /** Kiểm tra mã (không tiêu thụ mã) để giao diện mở bước nhập mật khẩu mới; sai vẫn tính vào 5 lần. */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void verifyResetCode(VerifyResetCodeRequest request) {
        checkResetCode(request.email(), request.code());
    }

    private PasswordResetToken checkResetCode(String email, String code) {
        var found = users.findByEmailIgnoreCase(normalizeEmail(email));
        if (found.isEmpty() || found.get().getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException(RESET_INVALID_MESSAGE);
        }
        User user = found.get();
        PasswordResetToken token =
                resetTokens
                        .findTopByUserIdOrderByCreatedAtDescIdDesc(user.getId())
                        .orElseThrow(() -> new IllegalArgumentException(RESET_INVALID_MESSAGE));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now(clock))) {
            throw new IllegalArgumentException(RESET_INVALID_MESSAGE);
        }
        if (token.getAttempts() >= RESET_MAX_ATTEMPTS) {
            throw new IllegalArgumentException(RESET_TOO_MANY_MESSAGE);
        }
        if (!codeMatches(user.getId(), code, token.getTokenHash())) {
            token.setAttempts(token.getAttempts() + 1);
            resetTokens.save(token);
            throw new IllegalArgumentException(
                    token.getAttempts() >= RESET_MAX_ATTEMPTS
                            ? RESET_TOO_MANY_MESSAGE
                            : RESET_INVALID_MESSAGE);
        }
        return token;
    }

    /** Dọn mã đặt lại đã tạo quá 1 ngày (gọi định kỳ bởi PasswordResetCleanupJob). */
    @Transactional
    public int purgeOldResetCodes() {
        long cutoff = clock.millis() - RESET_RESEND_SECONDS * 1000L;
        lastForgotAt.values().removeIf(sentAt -> sentAt < cutoff);
        return resetTokens.deleteCreatedBefore(LocalDateTime.now(clock).minusDays(1));
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

    /** 6 chữ số ngẫu nhiên (SecureRandom), có thể bắt đầu bằng 0. */
    static String randomCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    /** HMAC-SHA256 khóa bí mật trên "userId:code" (không dùng SHA-256 thuần vì chỉ có 10^6 khả năng). */
    private String codeHash(Long userId, String code) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(resetCodeKey, "HmacSHA256"));
            return HexFormat.of()
                    .formatHex(mac.doFinal((userId + ":" + code).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể băm mã xác nhận", exception);
        }
    }

    private boolean codeMatches(Long userId, String code, String storedHash) {
        return MessageDigest.isEqual(
                codeHash(userId, code).getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8));
    }

    /** Chặn xin mã quá dày theo email (mọi email như nhau, để 429 không lộ tài khoản). */
    private void throttleForgot(String email) {
        long now = clock.millis();
        long windowMs = RESET_RESEND_SECONDS * 1000L;
        if (lastForgotAt.size() > 10_000) lastForgotAt.values().removeIf(sentAt -> now - sentAt >= windowMs);
        long[] wait = {0};
        lastForgotAt.compute(
                email,
                (key, sentAt) -> {
                    if (sentAt != null && now - sentAt < windowMs) {
                        wait[0] = windowMs - (now - sentAt);
                        return sentAt;
                    }
                    return now;
                });
        if (wait[0] > 0) {
            long seconds = (wait[0] + 999) / 1000;
            throw new TooManyRequestsException(
                    "Bạn vừa yêu cầu mã. Vui lòng thử lại sau " + seconds + " giây.", seconds);
        }
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
