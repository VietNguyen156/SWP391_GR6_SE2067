package elearning.repository;

import elearning.entity.ReadingAnswer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReadingAnswerRepository extends JpaRepository<ReadingAnswer, Long> {
    List<ReadingAnswer> findAllByAttemptId(Long attemptId);
}
