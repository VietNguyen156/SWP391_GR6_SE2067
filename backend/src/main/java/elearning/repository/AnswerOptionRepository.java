package elearning.repository;

import elearning.entity.AnswerOption;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface AnswerOptionRepository extends JpaRepository<AnswerOption, Long> {
    List<AnswerOption> findAllByQuestionIdOrderBySortOrderAsc(Long questionId);

    Optional<AnswerOption> findByIdAndQuestionId(Long id, Long questionId);

}
