package elearning.repository;

import elearning.entity.AnswerSubmission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface AnswerSubmissionRepository extends JpaRepository<AnswerSubmission, Long> {
    Optional<AnswerSubmission> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);

    List<AnswerSubmission> findAllByAttemptId(Long attemptId);
}
