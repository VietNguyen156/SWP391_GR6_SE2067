package com.elearning.auth;
import com.elearning.auth.dto.*;
import com.elearning.security.JwtService;
import com.elearning.user.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class AuthService {
    private final UserRepository users; private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder encoder; private final JwtService jwt;
    public AuthService(UserRepository users,PasswordResetTokenRepository resetTokens,PasswordEncoder encoder,JwtService jwt){
        this.users=users;this.resetTokens=resetTokens;this.encoder=encoder;this.jwt=jwt;
    }
    @Transactional public AuthResponse register(RegisterRequest r){
        String email=r.email().trim().toLowerCase();
        if(users.existsByEmailIgnoreCase(email)) throw new IllegalArgumentException("Email đã được sử dụng");
        User u=new User(); u.setFullName(r.fullName().trim());u.setEmail(email);u.setPasswordHash(encoder.encode(r.password()));
        u.setPhone(r.phone()==null?null:r.phone().trim());u.setRole(UserRole.STUDENT);u.setStatus(UserStatus.ACTIVE); users.save(u);
        return new AuthResponse(jwt.generate(u),toResponse(u));
    }
    @Transactional public AuthResponse login(LoginRequest r){
        User u=users.findByEmailIgnoreCase(r.email().trim()).orElseThrow(()->new IllegalArgumentException("Email hoặc mật khẩu không đúng"));
        if(u.getStatus()!=UserStatus.ACTIVE || !encoder.matches(r.password(),u.getPasswordHash())) throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        u.setLastLoginAt(LocalDateTime.now()); users.save(u); return new AuthResponse(jwt.generate(u),toResponse(u));
    }
    @Transactional public ForgotPasswordResponse forgot(ForgotPasswordRequest r){
        var user=users.findByEmailIgnoreCase(r.email().trim());
        if(user.isEmpty()) return new ForgotPasswordResponse("Nếu email tồn tại, yêu cầu đặt lại mật khẩu đã được tạo.",null);
        String raw=UUID.randomUUID().toString(); PasswordResetToken t=new PasswordResetToken();t.setUser(user.get());t.setTokenHash(hash(raw));
        t.setExpiresAt(LocalDateTime.now().plusMinutes(15)); resetTokens.save(t);
        return new ForgotPasswordResponse("Mã đặt lại mật khẩu có hiệu lực 15 phút. Ở bản demo mã được trả về trực tiếp.",raw);
    }
    @Transactional public void reset(ResetPasswordRequest r){
        PasswordResetToken t=resetTokens.findByTokenHash(hash(r.token())).orElseThrow(()->new IllegalArgumentException("Mã đặt lại mật khẩu không hợp lệ"));
        if(t.getUsedAt()!=null || t.getExpiresAt().isBefore(LocalDateTime.now())) throw new IllegalArgumentException("Mã đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng");
        User u=t.getUser();u.setPasswordHash(encoder.encode(r.newPassword()));users.save(u);t.setUsedAt(LocalDateTime.now());resetTokens.save(t);
    }
    public UserResponse me(String email){return toResponse(users.findByEmailIgnoreCase(email).orElseThrow());}
    private UserResponse toResponse(User u){return new UserResponse(u.getId(),u.getFullName(),u.getEmail(),u.getRole().name(),u.getPhone());}
    private String hash(String raw){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
}
