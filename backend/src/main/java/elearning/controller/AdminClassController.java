package elearning.controller;

import elearning.dto.ClassroomDto.ClassRoomResponse;
import elearning.service.ClassRoomService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/classes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminClassController {
    private final ClassRoomService service;

    public AdminClassController(ClassRoomService s) {
        service = s;
    }

    @GetMapping
    public List<ClassRoomResponse> list() {
        return service.adminClasses();
    }
}
