package elearning.repository;

import elearning.entity.ListeningAnswer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListeningAnswerRepository extends JpaRepository<ListeningAnswer, Long> {
    List<ListeningAnswer> findAllByAttemptId(Long attemptId);
}
