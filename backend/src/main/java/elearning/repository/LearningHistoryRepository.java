package elearning.repository;

import elearning.entity.LearningHistory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface LearningHistoryRepository extends JpaRepository<LearningHistory, Long> {
    List<LearningHistory> findTop50ByStudentIdOrderByCreatedAtDesc(Long studentId);

    boolean existsByStudentIdAndActivityTypeAndActivityId(
            Long studentId, LearningHistory.ActivityType type, Long activityId);
}
