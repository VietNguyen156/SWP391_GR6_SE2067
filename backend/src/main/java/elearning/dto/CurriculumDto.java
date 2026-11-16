package elearning.dto;

import elearning.entity.CourseWeek;
import elearning.validation.VisibilityStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class CurriculumDto {
    private CurriculumDto() {}

    public record WeekRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            @VisibilityStatus CourseWeek.Status status) {}

    public record WeekSummary(
            Long id,
            Integer weekNumber,
            String title,
            String description,
            String status,
            List<LessonSummary> lessons) {

        public record LessonSummary(
                Long id,
                String title,
                String description,
                Integer sortOrder,
                Integer estimatedMinutes,
                String status,
                boolean locked,
                String lockReason,
                String progressStatus,
                BigDecimal progressPercent,
                List<ContentRef> materials) {}

        /**
         * Một học liệu trong bài học. type: GRAMMAR, FLASHCARD, LISTENING, READING, SPEAKING.
         */
        public record ContentRef(
                Long id,
                Long lessonId,
                String title,
                String status,
                String type,
                String extra) {}
    }
}
