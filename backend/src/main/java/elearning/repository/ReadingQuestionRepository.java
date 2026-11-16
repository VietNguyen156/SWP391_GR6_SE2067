package elearning.repository;

import elearning.entity.ReadingQuestion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReadingQuestionRepository extends JpaRepository<ReadingQuestion, Long> {
    List<ReadingQuestion> findAllByActivityIdOrderBySortOrderAsc(Long activityId);
}
