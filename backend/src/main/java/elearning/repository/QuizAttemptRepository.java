package elearning.repository;

import elearning.entity.QuizAttempt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findAllByStudentIdAndStatusNotOrderByStartTimeDesc(
            Long studentId, QuizAttempt.Status status);

    List<QuizAttempt> findAllByStatusNotOrderByStartTimeDesc(QuizAttempt.Status status);

    List<QuizAttempt> findAllByQuizCourseIdAndStatusNot(Long courseId, QuizAttempt.Status status);

    long countByStatusNot(QuizAttempt.Status status);

    Optional<QuizAttempt> findByIdAndStudentId(Long id, Long studentId);

    Optional<QuizAttempt> findTopByQuizIdAndStudentIdAndStatusOrderByStartTimeDesc(
            Long quizId, Long studentId, QuizAttempt.Status status);

    boolean existsByQuizId(Long quizId);

    boolean existsByQuizIdIn(Collection<Long> quizIds);

    /** Các lượt đã nộp của một học viên cho một quiz, mới nhất trước. */
    List<QuizAttempt> findAllByQuizIdAndStudentIdAndStatusNotOrderByStartTimeDesc(
            Long quizId, Long studentId, QuizAttempt.Status status);
}
