package elearning.exception;

/**
 * Học viên không được mở nội dung vì một lý do nghiệp vụ (chưa tham gia lớp, bài bị khóa).
 *
 * <p>Trả về 403 kèm {@code code} và lý do thật bằng tiếng Việt để giao diện hiện đúng nút: tham
 * gia lớp, về bài học, về khóa học. "Không tồn tại / nháp" vẫn dùng 404.
 */
public class LearningAccessException extends RuntimeException {
    public static final String NOT_ENROLLED = "NOT_ENROLLED";
    public static final String LESSON_LOCKED = "LESSON_LOCKED";

    private final String code;
    private final Long courseId;
    private final Long lessonId;

    public LearningAccessException(String code, String message, Long courseId, Long lessonId) {
        super(message);
        this.code = code;
        this.courseId = courseId;
        this.lessonId = lessonId;
    }

    public static LearningAccessException notEnrolled(String message, Long courseId) {
        return new LearningAccessException(NOT_ENROLLED, message, courseId, null);
    }

    public static LearningAccessException locked(String message, Long courseId, Long lessonId) {
        return new LearningAccessException(LESSON_LOCKED, message, courseId, lessonId);
    }

    public String getCode() {
        return code;
    }

    public Long getCourseId() {
        return courseId;
    }

    public Long getLessonId() {
        return lessonId;
    }
}
