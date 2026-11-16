package elearning.controller;

import elearning.dto.AdminDto.AdminCourseResponse;
import elearning.dto.AdminDto.AdminCourseStatusRequest;
import elearning.dto.AdminDto.AdminDashboardResponse;
import elearning.dto.AdminDto.AdminReportResponse;
import elearning.dto.AdminDto.AdminUserResponse;
import elearning.dto.AdminDto.UserStatusUpdateRequest;
import elearning.service.AdminService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService admin;

    public AdminController(AdminService a) {
        admin = a;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        return admin.dashboard();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users() {
        return admin.users();
    }

    @GetMapping("/users/{id}")
    public AdminUserResponse user(@PathVariable Long id) {
        return admin.user(id);
    }

    @PutMapping("/users/{id}/status")
    public AdminUserResponse status(
            Principal p, @PathVariable Long id, @Valid @RequestBody UserStatusUpdateRequest r) {
        return admin.updateUserStatus(p.getName(), id, r);
    }

    @GetMapping("/courses")
    public List<AdminCourseResponse> courses() {
        return admin.courses();
    }

    @PutMapping("/courses/{id}/status")
    public AdminCourseResponse courseStatus(
            @PathVariable Long id, @Valid @RequestBody AdminCourseStatusRequest r) {
        return admin.updateCourseStatus(id, r);
    }

    @PutMapping("/courses/{id}/price")
    public AdminCourseResponse coursePrice(
            @PathVariable Long id, @Valid @RequestBody elearning.dto.PaymentDto.PriceRequest r) {
        return admin.updateCoursePrice(id, r.price());
    }

    @GetMapping("/reports")
    public AdminReportResponse reports() {
        return admin.report();
    }
}
