package elearning.controller;

import elearning.dto.ClassroomDto.ClassDetailResponse;
import elearning.dto.ClassroomDto.ClassRoomRequest;
import elearning.dto.ClassroomDto.ClassRoomResponse;
import elearning.dto.ClassroomDto.ClassStudentResponse;
import elearning.dto.ClassroomDto.ClassSubmissionResponse;
import elearning.service.ClassRoomService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/classes")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherClassController {
    private final ClassRoomService service;

    public TeacherClassController(ClassRoomService s) {
        service = s;
    }

    @GetMapping
    public List<ClassRoomResponse> list(Principal p) {
        return service.teacherClasses(p.getName());
    }

    @GetMapping("/{id}")
    public ClassDetailResponse get(Principal p, @PathVariable Long id) {
        return service.teacherClass(p.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassRoomResponse create(Principal p, @Valid @RequestBody ClassRoomRequest r) {
        return service.create(p.getName(), r);
    }

    @PutMapping("/{id}")
    public ClassRoomResponse update(
            Principal p, @PathVariable Long id, @Valid @RequestBody ClassRoomRequest r) {
        return service.update(p.getName(), id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal p, @PathVariable Long id) {
        service.delete(p.getName(), id);
    }

    @GetMapping("/{id}/students")
    public List<ClassStudentResponse> students(Principal p, @PathVariable Long id) {
        return service.students(p.getName(), id);
    }

    @GetMapping("/{id}/submissions")
    public List<ClassSubmissionResponse> submissions(Principal p, @PathVariable Long id) {
        return service.submissions(p.getName(), id);
    }
}
