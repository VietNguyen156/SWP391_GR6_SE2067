package elearning.repository;

import elearning.entity.ClassEnrollment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, Long> {
    List<ClassEnrollment> findAllByClassroomIdAndStatusOrderByJoinedAtDesc(
            Long classId, ClassEnrollment.Status status);

    Optional<ClassEnrollment> findByClassroomIdAndStudentId(Long classId, Long studentId);

    List<ClassEnrollment> findAllByStudentIdAndStatusOrderByJoinedAtDesc(
            Long studentId, ClassEnrollment.Status status);

    List<ClassEnrollment> findAllByClassroomCourseIdAndStatus(
            Long courseId, ClassEnrollment.Status status);


    boolean existsByStudentIdAndClassroomCourseIdAndStatus(
            Long studentId, Long courseId, ClassEnrollment.Status status);

    /** Mọi ghi danh (mọi trạng thái) của học viên trong các lớp thuộc một khóa. */
    List<ClassEnrollment> findAllByStudentIdAndClassroomCourseId(Long studentId, Long courseId);

    long countByClassroomIdAndStatus(Long classId, ClassEnrollment.Status status);

    boolean existsByClassroomId(Long classId);
}
