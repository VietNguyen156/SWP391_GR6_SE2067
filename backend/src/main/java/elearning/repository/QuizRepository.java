package elearning.repository;

import elearning.entity.Quiz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findAllByCreatedByIdOrderByUpdatedAtDesc(Long userId);

    Optional<Quiz> findByIdAndCreatedById(Long id, Long userId);

    List<Quiz> findAllByStatusOrderByCreatedAtDesc(Quiz.Status status);

    Optional<Quiz> findByIdAndStatus(Long id, Quiz.Status status);

    List<Quiz> findAllByLessonIdOrderByCreatedAtAsc(Long lessonId);

    boolean existsByLessonId(Long lessonId);

    /** Số câu luyện tập khác nhau trong các quiz đang hiển thị của khóa (thẻ giá ở trang khóa học). */
    @Query(
            "select count(distinct qq.question.id) from QuizQuestion qq"
                    + " where qq.quiz.course.id = :courseId and qq.quiz.status = elearning.entity.Quiz.Status.PUBLISHED")
    long countQuestionsOfPublishedCourseQuizzes(@Param("courseId") Long courseId);
}
