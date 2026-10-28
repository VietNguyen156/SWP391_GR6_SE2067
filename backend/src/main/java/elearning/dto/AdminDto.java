package elearning.dto;

import elearning.entity.UserStatus;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
            long totalLessons) {}

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
