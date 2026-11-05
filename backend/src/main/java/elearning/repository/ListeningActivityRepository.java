package elearning.repository;

import elearning.entity.ListeningActivity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ListeningActivityRepository extends JpaRepository<ListeningActivity, Long> {
    List<ListeningActivity> findAllByCourseWeekIdOrderByUpdatedAtDesc(Long weekId);

    List<ListeningActivity> findAllByAudioUrl(String audioUrl);

    Optional<ListeningActivity> findByIdAndTeacherId(Long id, Long teacherId);
    boolean existsByLessonId(Long lessonId);

    List<ListeningActivity> findAllByLessonIdOrderByCreatedAtAsc(Long lessonId);

}
