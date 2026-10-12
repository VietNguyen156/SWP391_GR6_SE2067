package elearning.repository;

import elearning.entity.QuizQuestion;
import elearning.entity.QuizQuestionId;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, QuizQuestionId> {
    List<QuizQuestion> findAllByQuizIdOrderBySortOrderAsc(Long quizId);

    boolean existsByQuizIdAndQuestionId(Long quizId, Long questionId);

    void deleteAllByQuizId(Long quizId);

    List<QuizQuestion> findAllByQuestionId(Long questionId);

}
