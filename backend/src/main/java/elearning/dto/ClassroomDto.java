package elearning.dto;

import elearning.entity.ClassRoom;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ClassroomDto {
    private ClassroomDto() {}

    public record ClassDetailResponse(
            ClassRoomResponse classroom,
            List<ClassStudentResponse> students,
            List<ClassLessonProgressResponse> lessonProgress,
            BigDecimal completionPercentage) {}

    public record ClassLessonProgressResponse(
            Long lessonId,
            String lessonTitle,
            long completedStudents,
            long totalStudents,
            BigDecimal completionPercentage) {}

    public record ClassRoomRequest(
            @NotNull @Positive Long courseId,
            @NotBlank @Size(max = 180) String className,
            @Size(max = 50) String classCode,
            @Size(max = 65535) String description,
            LocalDate startDate,
            LocalDate endDate,
            @Min(1) @Max(10000) Integer maxStudents,
            @NotNull ClassRoom.Status status) {}

    public record ClassRoomResponse(
            Long id,
            Long courseId,
            String courseTitle,
            Long teacherId,
            String teacherName,
            String className,
            String classCode,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            Integer maxStudents,
            String status,
            long studentCount,
            long lessonCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {}

    public record ClassStudentResponse(
            Long id,
            String email,
            String fullName,
            String avatarUrl,
            String status,
            LocalDateTime joinedAt,
            BigDecimal courseProgress) {}

    public record ClassSubmissionResponse(
            String type,
            Long submissionId,
            Long activityId,
            String activityTitle,
            Long studentId,
            String studentName,
            String studentEmail,
            String status,
            BigDecimal score,
            String feedback,
            LocalDateTime submittedAt,
            String recordingUrl) {}

    public record StudentClassProgressResponse(
            Long classId,
            Long courseId,
            String className,
            String courseTitle,
            Summary summary,
            List<WeekProgress> weeks,
            List<TypeProgress> types,
            List<RecentItem> recentItems) {
        public record Summary(
                int completedContent,
                int totalContent,
                int submittedCount,
                int gradedCount,
                BigDecimal averageScore) {}

        public record WeekProgress(
                Long weekId,
                int weekNumber,
                String title,
                int completed,
                int total,
                BigDecimal percentage) {}

        public record TypeProgress(
                String type,
                String label,
                int completed,
                int total,
                Integer graded,
                BigDecimal averageScore) {}

        public record RecentItem(
                String type,
                String title,
                String status,
                BigDecimal score,
                LocalDateTime occurredAt) {}
    }
}
