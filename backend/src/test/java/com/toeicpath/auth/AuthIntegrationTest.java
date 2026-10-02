package com.toeicpath.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeicpath.user.User;
import com.toeicpath.user.UserRepository;
import com.toeicpath.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {
    private static final String EMAIL = "student@example.com";
    private static final String PASSWORD = "Student@123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void cleanDatabase() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registersStudentWithNormalizedEmailAndNoPasswordInResponse() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"  Student@Example.com ","password":"Student@123","fullName":" Nguyen Van A ","role":"ADMIN"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value(EMAIL))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.data.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test
    void rejectsDuplicateEmail() throws Exception {
        register();
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("STUDENT@EXAMPLE.COM", PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_EMAIL"));
    }

    @Test
    void loginReturnsAccessTokenAndHttpOnlyRefreshCookie() throws Exception {
        register();
        MvcResult result = login(EMAIL, PASSWORD);
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());

        assertThat(body.at("/data/accessToken").asText()).isNotBlank();
        assertThat(body.at("/data/tokenType").asText()).isEqualTo("Bearer");
        assertThat(result.getResponse().getHeader("Set-Cookie"))
                .contains("HttpOnly", "SameSite=Lax", "toeic_refresh=");
    }

    @Test
    void rejectsIncorrectPasswordWithInvalidCredentials() throws Exception {
        register();
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(EMAIL, "WrongPassword1!")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("INVALID_CREDENTIALS"));
    }

    @Test
    void blockedAccountCannotLogin() throws Exception {
        register();
        User user = userRepository.findByEmail(EMAIL).orElseThrow();
        user.setStatus(UserStatus.BLOCKED);
        userRepository.saveAndFlush(user);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(EMAIL, PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT_BLOCKED"));
    }

    @Test
    void meReturnsAuthenticatedUser() throws Exception {
        register();
        String token = accessToken(login(EMAIL, PASSWORD));
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(EMAIL))
                .andExpect(jsonPath("$.data.role").value("STUDENT"));
    }

    @Test
    void meRequiresAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void meRejectsInvalidAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void studentCannotAccessMentorOrAdminEndpoints() throws Exception {
        register();
        String token = accessToken(login(EMAIL, PASSWORD));
        mockMvc.perform(get("/api/v1/mentor/ping").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
        mockMvc.perform(get("/api/v1/admin/ping").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    void databaseStoresBcryptHashRatherThanPlainPassword() throws Exception {
        register();
        String passwordHash = userRepository.findByEmail(EMAIL).orElseThrow().getPasswordHash();
        assertThat(passwordHash).startsWith("$2").isNotEqualTo(PASSWORD);
    }

    @Test
    void refreshRotatesCookieAndReturnsNewAccessToken() throws Exception {
        register();
        MvcResult login = login(EMAIL, PASSWORD);
        String originalAccessToken = accessToken(login);
        MockCookie originalRefreshCookie = refreshCookie(login);

        MvcResult refreshed = mockMvc.perform(post("/api/v1/auth/refresh").cookie(originalRefreshCookie))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(accessToken(refreshed)).isNotEqualTo(originalAccessToken);
        assertThat(refreshed.getResponse().getHeader("Set-Cookie"))
                .isNotEqualTo(login.getResponse().getHeader("Set-Cookie"));
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(originalRefreshCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("INVALID_REFRESH_TOKEN"));
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        register();
        MvcResult login = login(EMAIL, PASSWORD);
        MockCookie cookie = refreshCookie(login);
        mockMvc.perform(post("/api/v1/auth/logout").cookie(cookie))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("INVALID_REFRESH_TOKEN"));
    }

    private void register() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(EMAIL, PASSWORD)))
                .andExpect(status().isCreated());
    }

    private MvcResult login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password)))
                .andExpect(status().isOk())
                .andReturn();
    }

    private String accessToken(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .at("/data/accessToken").asText();
    }

    private MockCookie refreshCookie(MvcResult result) {
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        String value = setCookie.substring("toeic_refresh=".length(), setCookie.indexOf(';'));
        return new MockCookie("toeic_refresh", value);
    }

    private String registerJson(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password
                + "\",\"fullName\":\"Nguyen Van A\"}";
    }

    private String loginJson(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }
}