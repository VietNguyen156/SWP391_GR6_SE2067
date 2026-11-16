package elearning.dto;

import elearning.entity.UserStatus;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class AdminDto {
    private AdminDto() {}

    public record AdminCourseResponse(
            Long id,
            String title,
            String slug,
            Long teacherId,
            String teacherName,
            String teacherEmail,
            String status,
            long lessonCount,
            /** Giá bán (đồng); 0 = miễn phí. */
            Long price,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {}

    public record AdminCourseStatusRequest(@NotNull Status status) {
        public enum Status {
            ACTIVE,
            HIDDEN
        }
    }

    public record AdminDashboardResponse(
            long totalUsers,
            long totalStudents,
            long totalTeachers,
            long totalCourses,
            long totalTests,
            long totalLessons,
            /** Số khóa theo trạng thái: DRAFT, PUBLISHED, OTHER (HIDDEN/ARCHIVED cũ). */
            Map<String, Long> courseStatusCounts,
            long activeClasses,
            long totalClasses,
            /** Tổng sĩ số tối đa / học viên đang học của các lớp đang mở có đặt sĩ số. */
            long openClassCapacity,
            long openClassEnrolled,
            /** Phần trăm lấp đầy (0–100) của các lớp đang mở; null nếu chưa lớp nào đặt sĩ số. */
            BigDecimal classFillRate,
            List<ClassFill> classFills,
            List<IncompleteCourse> incompleteCourses,
            /** Đơn học viên đã báo chuyển khoản, đang chờ admin xác nhận. */
            long pendingOrders) {

        public record ClassFill(
                Long id,
                String className,
                String courseTitle,
                int enrolled,
                int capacity,
                BigDecimal fillRate) {}

        public record IncompleteCourse(
                Long id, String title, String teacherName, String status, List<String> issues) {}
    }

    public record AdminReportResponse(
            long totalLessonsCompleted,
            long totalTestsCompleted,
            BigDecimal averageTestScore,
            long activeUsers) {}

    public record AdminUserResponse(
            Long id,
            String email,
            String fullName,
            String phone,
            String avatarUrl,
            String role,
            String status,
            LocalDateTime createdAt,
            LocalDateTime lastLoginAt) {}

    public record UserStatusUpdateRequest(@NotNull UserStatus status) {}
}
