package elearning.repository;

import elearning.entity.Question;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findAllByCreatedByIdOrderByUpdatedAtDesc(Long userId);

    Optional<Question> findByIdAndCreatedById(Long id, Long userId);
}
