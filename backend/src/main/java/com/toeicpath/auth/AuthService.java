package com.toeicpath.auth;

import com.toeicpath.auth.dto.AuthResponse;
import com.toeicpath.auth.dto.LoginRequest;
import com.toeicpath.auth.dto.RegisterRequest;
import com.toeicpath.auth.dto.UserResponse;
import com.toeicpath.security.JwtService;
import com.toeicpath.user.User;
import com.toeicpath.user.UserRepository;
import com.toeicpath.user.UserRole;
import com.toeicpath.user.UserStatus;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long refreshExpirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new AuthException(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", "Email is already registered");
        }
        User user;
        try {
            user = userRepository.saveAndFlush(new User(email, passwordEncoder.encode(request.password()),
                    request.fullName().trim(), UserRole.STUDENT, UserStatus.ACTIVE));
        } catch (DataIntegrityViolationException exception) {
            throw new AuthException(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", "Email is already registered");
        }
        return UserResponse.from(user);
    }

    @Transactional
    public AuthSession login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AuthException(HttpStatus.FORBIDDEN, "ACCOUNT_BLOCKED", "This account is blocked");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw invalidCredentials();
        }
        return createSession(user);
    }

    @Transactional
    public AuthSession refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw invalidRefreshToken();
        }
        RefreshToken current = refreshTokenRepository.findByTokenHashForUpdate(hashToken(rawToken))
                .orElseThrow(this::invalidRefreshToken);
        LocalDateTime now = LocalDateTime.now();
        if (current.getRevokedAt() != null || !current.getExpiresAt().isAfter(now)) {
            throw invalidRefreshToken();
        }
        User user = current.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            current.revoke(now);
            throw new AuthException(HttpStatus.FORBIDDEN, "ACCOUNT_BLOCKED", "This account is not active");
        }
        current.revoke(now);
        return createSession(user);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(hashToken(rawToken))
                .filter(token -> token.getRevokedAt() == null)
                .ifPresent(token -> token.revoke(LocalDateTime.now()));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .filter(account -> account.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Authentication is required"));
        return UserResponse.from(user);
    }

    private AuthSession createSession(User user) {
        byte[] tokenBytes = new byte[48];
        secureRandom.nextBytes(tokenBytes);
        String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        refreshTokenRepository.save(new RefreshToken(user, hashToken(refreshToken),
                LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000)));
        AuthResponse response = new AuthResponse(jwtService.createAccessToken(user), "Bearer",
            jwtService.getAccessExpirationSeconds(), UserResponse.from(user));
        return new AuthSession(response, refreshToken);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private AuthException invalidCredentials() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }

    private AuthException invalidRefreshToken() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
    }
}