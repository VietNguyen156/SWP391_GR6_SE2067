package elearning.repository;

import elearning.entity.ClassRoom;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface ClassRoomRepository extends JpaRepository<ClassRoom, Long> {
    List<ClassRoom> findAllByTeacherIdOrderByUpdatedAtDesc(Long teacherId);

    Optional<ClassRoom> findByIdAndTeacherId(Long id, Long teacherId);

    List<ClassRoom> findAllByOrderByUpdatedAtDesc();

    long countByCourseId(Long courseId);

    List<ClassRoom> findAllByCourseId(Long courseId);

    /** SELECT ... FOR UPDATE: hai học viên vào lớp cùng lúc phải đếm chỗ lần lượt, không vượt sĩ số. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ClassRoom c where c.id = :id")
    Optional<ClassRoom> lockById(@Param("id") Long id);

    boolean existsByClassCodeIgnoreCase(String code);

    boolean existsByClassCodeIgnoreCaseAndIdNot(String code, Long id);
}
