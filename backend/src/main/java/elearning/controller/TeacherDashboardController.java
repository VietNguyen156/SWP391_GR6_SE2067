package elearning.controller;

import elearning.dto.ProgressDto.TeacherDashboardResponse;
import elearning.service.DashboardService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/teacher/dashboard")
@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
public class TeacherDashboardController {
    private final DashboardService service;

    public TeacherDashboardController(DashboardService s) {
        service = s;
    }

    @GetMapping
    public TeacherDashboardResponse dashboard(Principal p) {
        return service.teacherDashboard(p.getName());
    }
}
