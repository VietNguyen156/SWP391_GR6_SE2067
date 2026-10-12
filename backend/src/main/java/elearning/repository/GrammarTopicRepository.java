package elearning.repository;

import elearning.entity.GrammarTopic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface GrammarTopicRepository extends JpaRepository<GrammarTopic, Long> {
    List<GrammarTopic> findAllByCourseWeekIdOrderByUpdatedAtDesc(Long courseWeekId);

    List<GrammarTopic> findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(Long teacherId);

    Optional<GrammarTopic> findByIdAndCreatedByTeacherId(Long id, Long teacherId);

    List<GrammarTopic> findAllByStatusOrderByCreatedAtDesc(GrammarTopic.Status status);

    Optional<GrammarTopic> findByIdAndStatus(Long id, GrammarTopic.Status status);
    boolean existsByLessonId(Long lessonId);

    List<GrammarTopic> findAllByLessonIdOrderByCreatedAtAsc(Long lessonId);

}
