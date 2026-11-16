package elearning.dto;

import elearning.entity.Course;
import elearning.validation.VisibilityStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class CourseDto {
    private CourseDto() {}

    public record CourseResponse(
            Long id,
            Long teacherId,
            String teacherName,
            String title,
            String slug,
            String description,
            String level,
            /** Số tuần thực có của khóa học. */
            long weekCount,
            Integer targetScore,
            /** Giá bán (đồng, chỉ admin sửa); 0 = miễn phí. */
            Long price,
            String thumbnailUrl,
            String status,
            LocalDateTime publishedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {}

    public record CourseSummaryResponse(
            Long id,
            String title,
            String slug,
            String description,
            String level,
            long weekCount,
            Integer targetScore,
            Long price,
            String thumbnailUrl,
            String status,
            long lessonCount,
            LocalDateTime publishedAt,
            LocalDateTime updatedAt) {}

    public record CreateCourseRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 65535) String description,
            Course.Level level,
            @Min(0) @Max(990) Integer targetScore,
            @Size(max = 500) String thumbnailUrl,
            @VisibilityStatus Course.Status status) {}

    public record LessonCompletionResponse(
            Long lessonId, String status, BigDecimal progressPercent, LocalDateTime completedAt) {}

    /** Một học liệu bắt buộc phải nộp để hoàn thành bài: type LISTENING / READING / SPEAKING. */
    public record CompletionRequirement(String type, Long id, String title, boolean done) {}

    public record LessonRequest(
            @Positive Long courseWeekId,
            @NotBlank @Size(max = 200) String title,
            @Size(max = 65535) String description,
            @Positive @Max(65535) Integer estimatedMinutes) {}

    public record LessonResponse(
            Long id,
            Long courseId,
            String courseTitle,
            Long courseWeekId,
            Integer weekNumber,
            String weekTitle,
            String title,
            String description,
            Integer sortOrder,
            Integer estimatedMinutes,
            String status,
            String progressStatus,
            BigDecimal progressPercent,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            /** Toàn bộ học liệu của bài học theo thứ tự hiển thị. */
            List<elearning.dto.CurriculumDto.WeekSummary.ContentRef> materials,
            /** Điều kiện hoàn thành bài (chỉ có ở góc nhìn học viên). */
            List<CompletionRequirement> completionRequirements) {}

    public record ReorderRequest(@NotEmpty List<@NotNull @Positive Long> ids) {}

    public record UpdateCourseRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 65535) String description,
            Course.Level level,
            @Min(0) @Max(990) Integer targetScore,
            @Size(max = 500) String thumbnailUrl,
            @NotNull @VisibilityStatus Course.Status status) {}
}
