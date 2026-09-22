package com.elearning.common;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class HealthControllerTest {
    @Test
    void returnsHealthStatus() throws Exception {
        MockMvcBuilders.standaloneSetup(new HealthController()).build()
            .perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
}

