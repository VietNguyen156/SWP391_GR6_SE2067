package elearning.controller;

import elearning.dto.CourseDto.CourseSummaryResponse;
import elearning.service.CourseService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Danh sách khóa học đã xuất bản cho khách chưa đăng nhập (chỉ thông tin tóm tắt). */
@RestController
@RequestMapping("/api/public/courses")
public class PublicCourseController {
    private final CourseService service;

    public PublicCourseController(CourseService service) {
        this.service = service;
    }

    @GetMapping
    public List<CourseSummaryResponse> list() {
        return service.publishedCourses();
    }
}
