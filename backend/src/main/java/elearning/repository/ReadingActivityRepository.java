package elearning.repository;

import elearning.entity.ReadingActivity;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReadingActivityRepository extends JpaRepository<ReadingActivity, Long> {
    List<ReadingActivity> findAllByTeacherIdOrderByUpdatedAtDesc(Long teacherId);

    boolean existsByLessonId(Long lessonId);

    List<ReadingActivity> findAllByLessonIdOrderByCreatedAtAsc(Long lessonId);

    /** SELECT ... FOR UPDATE: thêm tệp đính kèm lần lượt theo bài (thứ tự, giới hạn 10 tệp). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from ReadingActivity a where a.id = :id")
    Optional<ReadingActivity> lockById(@Param("id") Long id);
}
