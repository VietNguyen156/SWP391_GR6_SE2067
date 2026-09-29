package elearning.repository;

import elearning.entity.GrammarTopic;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface GrammarTopicRepository extends JpaRepository<GrammarTopic, Long> {
    List<GrammarTopic> findAllByCourseWeekIdOrderByUpdatedAtDesc(Long courseWeekId);

    List<GrammarTopic> findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(Long teacherId);

    Optional<GrammarTopic> findByIdAndCreatedByTeacherId(Long id, Long teacherId);

    List<GrammarTopic> findAllByStatusOrderByCreatedAtDesc(GrammarTopic.Status status);

    Optional<GrammarTopic> findByIdAndStatus(Long id, GrammarTopic.Status status);

    /** SELECT ... FOR UPDATE: thêm tệp đính kèm lần lượt theo chủ đề (thứ tự, giới hạn 10 tệp). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from GrammarTopic t where t.id = :id")
    Optional<GrammarTopic> lockById(@Param("id") Long id);

    boolean existsByLessonId(Long lessonId);

    List<GrammarTopic> findAllByLessonIdOrderByCreatedAtAsc(Long lessonId);

}
