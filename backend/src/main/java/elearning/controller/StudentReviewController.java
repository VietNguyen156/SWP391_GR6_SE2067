package elearning.controller;

import elearning.dto.ReviewDto.ReviewResponse;
import elearning.service.ReviewService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/student/review")
@PreAuthorize("hasRole('STUDENT')")
public class StudentReviewController {
    private final ReviewService service;

    public StudentReviewController(ReviewService service) {
        this.service = service;
    }

    /** Dữ liệu trang Ôn tập: flashcard cá nhân, ngữ pháp và flashcards đã mở. */
    @GetMapping
    public ReviewResponse review(Principal principal) {
        return service.review(principal.getName());
    }
}
