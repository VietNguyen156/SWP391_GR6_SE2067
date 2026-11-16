package elearning.service;

import elearning.dto.AdminDto.AdminCourseResponse;
import elearning.dto.AdminDto.AdminCourseStatusRequest;
import elearning.dto.AdminDto.AdminDashboardResponse;
import elearning.dto.AdminDto.AdminReportResponse;
import elearning.dto.AdminDto.AdminUserResponse;
import elearning.dto.AdminDto.UserStatusUpdateRequest;
import elearning.entity.Course;
import elearning.entity.LessonProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.CourseRepository;
import elearning.repository.LessonProgressRepository;
import elearning.repository.LessonRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class AdminService {
    private final UserRepository users;
    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final LessonProgressRepository lessonProgress;
    private final JdbcTemplate db;

    public AdminService(
            UserRepository u,
            CourseRepository c,
            LessonRepository l,
            LessonProgressRepository lp,
            JdbcTemplate db) {
        users = u;
        courses = c;
        lessons = l;
        lessonProgress = lp;
        this.db = db;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard() {
        return new AdminDashboardResponse(
                users.count(),
                users.countByRole(UserRole.STUDENT),
                users.countByRole(UserRole.TEACHER),
                courses.count(),
                db.queryForObject("SELECT COUNT(*) FROM course_tests", Long.class),
                lessons.count());
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> users() {
        return users.findAllByOrderByCreatedAtDesc().stream().map(this::userResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminUserResponse user(Long id) {
        return userResponse(findUser(id));
    }

    public AdminUserResponse updateUserStatus(
            String adminEmail, Long id, UserStatusUpdateRequest request) {
        User admin = admin(adminEmail);
        User target = findUser(id);
        if (admin.getId().equals(target.getId()) && request.status() != UserStatus.ACTIVE)
            throw new IllegalArgumentException(
                    "Admin không thể khóa hoặc vô hiệu hóa tài khoản của chính mình");
        target.setStatus(request.status());
        return userResponse(users.save(target));
    }

    @Transactional(readOnly = true)
    public List<AdminCourseResponse> courses() {
        return courses.findAllByOrderByUpdatedAtDesc().stream().map(this::courseResponse).toList();
    }

    public AdminCourseResponse updateCourseStatus(Long id, AdminCourseStatusRequest request) {
        Course course = findCourse(id);
        Course.Status previousStatus = course.getStatus();
        // Khóa học chỉ còn Đang hiển thị / Đã ẩn. "Đã ẩn" lưu DRAFT, giống khi giáo viên ẩn khóa.
        Course.Status status =
                switch (request.status()) {
                    case ACTIVE -> Course.Status.PUBLISHED;
                    case HIDDEN -> Course.Status.DRAFT;
                };
        course.setStatus(status);
        if (status == Course.Status.PUBLISHED && previousStatus != Course.Status.PUBLISHED) {
            course.setPublishedAt(LocalDateTime.now());
        }
        return courseResponse(courses.save(course));
    }

    /** Chỉ admin đặt giá; giá áp dụng cho đơn tạo sau đó (đơn cũ giữ giá lúc tạo). */
    public AdminCourseResponse updateCoursePrice(Long id, Long price) {
        Course course = findCourse(id);
        course.setPrice(price);
        return courseResponse(courses.save(course));
    }

    @Transactional(readOnly = true)
    public AdminReportResponse report() {
        BigDecimal average = db.queryForObject("SELECT COALESCE(AVG(100.0*earned_points/NULLIF(total_points,0)),0) FROM test_attempts WHERE status='GRADED'", BigDecimal.class);
        return new AdminReportResponse(
                lessonProgress.countByStatus(LessonProgress.Status.COMPLETED),
                db.queryForObject("SELECT COUNT(*) FROM test_attempts WHERE status<>'IN_PROGRESS'", Long.class),
                average,
                users.countByStatus(UserStatus.ACTIVE));
    }

    private AdminUserResponse userResponse(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getPhone(),
                u.getAvatarUrl(),
                u.getRole().name(),
                u.getStatus().name(),
                u.getCreatedAt(),
                u.getLastLoginAt());
    }

    private AdminCourseResponse courseResponse(Course c) {
        User t = c.getCreatedByTeacher();
        // Mọi trạng thái khác PUBLISHED (DRAFT, HIDDEN, ARCHIVED cũ) đều là "Đã ẩn" với admin.
        String status = c.getStatus() == Course.Status.PUBLISHED ? "ACTIVE" : "HIDDEN";
        return new AdminCourseResponse(
                c.getId(),
                c.getTitle(),
                c.getSlug(),
                t.getId(),
                t.getFullName(),
                t.getEmail(),
                status,
                lessons.countByCourseWeekCourseId(c.getId()),
                c.getPrice(),
                c.getCreatedAt(),
                c.getUpdatedAt());
    }

    private User findUser(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy người dùng"));
    }

    private Course findCourse(Long id) {
        return courses.findById(id)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy khóa học"));
    }

    private User admin(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(x -> x.getRole() == UserRole.ADMIN && x.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy quản trị viên"));
    }
}
