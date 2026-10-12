package elearning.repository;

import elearning.entity.ListeningQuestion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ListeningQuestionRepository extends JpaRepository<ListeningQuestion, Long> {
    List<ListeningQuestion> findAllByActivityIdOrderBySortOrderAsc(Long activityId);
}
