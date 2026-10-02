package com.toeicpath.catalog;

import com.toeicpath.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/courses")
public class PublicCourseController {

    private final PublicCourseService publicCourseService;

    public PublicCourseController(PublicCourseService publicCourseService) {
        this.publicCourseService = publicCourseService;
    }

    @GetMapping
    public ApiResponse<List<CourseSummary>> getCourses() {
        return ApiResponse.success(publicCourseService.getPublishedCourses());
    }
}

