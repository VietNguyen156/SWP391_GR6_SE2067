package elearning.repository;

import elearning.entity.CourseOrder;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CourseOrderRepository extends JpaRepository<CourseOrder, Long> {
    /** SELECT ... FOR UPDATE: mọi thao tác đổi trạng thái đều khóa dòng đơn trước. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CourseOrder o where o.id = :id")
    Optional<CourseOrder> lockById(@Param("id") Long id);

    Optional<CourseOrder> findByOrderCodeAndStudentId(String orderCode, Long studentId);

    Optional<CourseOrder> findByIdAndStudentId(Long id, Long studentId);

    boolean existsByOrderCode(String orderCode);

    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, CourseOrder.Status status);

    List<CourseOrder> findAllByStudentIdAndCourseIdAndStatusIn(
            Long studentId, Long courseId, Collection<CourseOrder.Status> statuses);

    List<CourseOrder> findAllByStudentIdAndCourseIdOrderByCreatedAtDescIdDesc(Long studentId, Long courseId);

    List<CourseOrder> findAllByStudentIdOrderByCreatedAtDescIdDesc(Long studentId);

    List<CourseOrder> findAllByStatusAndExpiresAtBefore(CourseOrder.Status status, LocalDateTime time);

    long countByStatus(CourseOrder.Status status);

    @Query("select coalesce(sum(o.amount), 0) from CourseOrder o where o.status = :status")
    long sumAmountByStatus(@Param("status") CourseOrder.Status status);

    @Query(
            value =
                    "select o from CourseOrder o join fetch o.student s join fetch o.course c"
                            + " where o.status in :statuses"
                            + " and (:courseId is null or c.id = :courseId)"
                            + " and (:from is null or o.createdAt >= :from)"
                            + " and (:to is null or o.createdAt < :to)"
                            + " and (:q = '' or lower(o.orderCode) like :q or lower(o.transferContent) like :q"
                            + " or lower(s.email) like :q or lower(s.fullName) like :q)",
            countQuery =
                    "select count(o) from CourseOrder o join o.student s join o.course c"
                            + " where o.status in :statuses"
                            + " and (:courseId is null or c.id = :courseId)"
                            + " and (:from is null or o.createdAt >= :from)"
                            + " and (:to is null or o.createdAt < :to)"
                            + " and (:q = '' or lower(o.orderCode) like :q or lower(o.transferContent) like :q"
                            + " or lower(s.email) like :q or lower(s.fullName) like :q)")
    Page<CourseOrder> search(
            @Param("statuses") Collection<CourseOrder.Status> statuses,
            @Param("courseId") Long courseId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("q") String q,
            Pageable pageable);
}
