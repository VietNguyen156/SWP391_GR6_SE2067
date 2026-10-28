package elearning.repository;

import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    /** Khóa dòng học viên để tuần tự hóa việc tạo đơn (tránh hai đơn mở cho cùng một khóa). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> lockById(@Param("id") Long id);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByOrderByCreatedAtDesc();

    long countByRole(UserRole role);

    long countByStatus(UserStatus status);
}
