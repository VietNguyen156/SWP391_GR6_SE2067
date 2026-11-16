package elearning.repository;

import elearning.entity.ClassRoom;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ClassRoomRepository extends JpaRepository<ClassRoom, Long> {
    List<ClassRoom> findAllByTeacherIdOrderByUpdatedAtDesc(Long teacherId);

    Optional<ClassRoom> findByIdAndTeacherId(Long id, Long teacherId);

    List<ClassRoom> findAllByOrderByUpdatedAtDesc();

    long countByCourseId(Long courseId);

    List<ClassRoom> findAllByCourseId(Long courseId);

    boolean existsByClassCodeIgnoreCase(String code);

    boolean existsByClassCodeIgnoreCaseAndIdNot(String code, Long id);
}
