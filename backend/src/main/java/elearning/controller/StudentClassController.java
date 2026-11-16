package elearning.controller;

import elearning.dto.ClassroomDto.ClassDetailResponse;
import elearning.dto.ClassroomDto.ClassRoomResponse;
import elearning.dto.ClassroomDto.StudentClassProgressResponse;
import elearning.service.ClassRoomService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@PreAuthorize("hasRole('STUDENT')")
public class StudentClassController {
    private final ClassRoomService service;

    public StudentClassController(ClassRoomService s) {
        service = s;
    }

    @PostMapping("/api/classes/{id}/join")
    public ClassRoomResponse join(Principal p, @PathVariable Long id) {
        return service.join(p.getName(), id);
    }

    @GetMapping("/api/student/classes")
    public List<ClassRoomResponse> list(Principal p) {
        return service.studentClasses(p.getName());
    }

    @GetMapping("/api/student/courses/{courseId}/classes")
    public List<ClassRoomResponse> courseClasses(@PathVariable Long courseId) {
        return service.studentCourseClasses(courseId);
    }

    @GetMapping("/api/student/classes/{id}")
    public ClassDetailResponse get(Principal p, @PathVariable Long id) {
        return service.studentClass(p.getName(), id);
    }

    @GetMapping("/api/student/classes/{id}/progress")
    public StudentClassProgressResponse progress(Principal p, @PathVariable Long id) {
        return service.studentClassProgress(p.getName(), id);
    }
}
