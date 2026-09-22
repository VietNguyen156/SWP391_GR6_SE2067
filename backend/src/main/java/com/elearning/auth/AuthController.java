package com.elearning.auth;
import com.elearning.auth.dto.*;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service; public AuthController(AuthService service){this.service=service;}
    @PostMapping("/register") public AuthResponse register(@Valid @RequestBody RegisterRequest r){return service.register(r);}
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest r){return service.login(r);}
    @PostMapping("/forgot-password") public ForgotPasswordResponse forgot(@Valid @RequestBody ForgotPasswordRequest r){return service.forgot(r);}
    @PostMapping("/reset-password") public Map<String,String> reset(@Valid @RequestBody ResetPasswordRequest r){service.reset(r);return Map.of("message","Đổi mật khẩu thành công");}
    @GetMapping("/me") public UserResponse me(Principal principal){return service.me(principal.getName());}
}
