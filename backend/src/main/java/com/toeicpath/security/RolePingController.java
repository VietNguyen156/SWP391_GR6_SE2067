package com.toeicpath.security;

import com.toeicpath.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RolePingController {

    @GetMapping("/api/v1/admin/ping")
    public ApiResponse<String> adminPing() {
        return ApiResponse.success("admin");
    }

    @GetMapping("/api/v1/mentor/ping")
    public ApiResponse<String> mentorPing() {
        return ApiResponse.success("mentor");
    }

    @GetMapping("/api/v1/student/ping")
    public ApiResponse<String> studentPing() {
        return ApiResponse.success("student");
    }
}