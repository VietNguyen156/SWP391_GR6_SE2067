package elearning.repository;

import elearning.entity.SpeakingActivity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface SpeakingActivityRepository extends JpaRepository<SpeakingActivity, Long> {
    List<SpeakingActivity> findAllByCourseWeekIdOrderByUpdatedAtDesc(Long weekId);

    Optional<SpeakingActivity> findByIdAndTeacherId(Long id, Long teacherId);
    boolean existsByLessonId(Long lessonId);

    List<SpeakingActivity> findAllByLessonIdOrderByCreatedAtAsc(Long lessonId);

}
