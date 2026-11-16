package elearning.repository;

import elearning.entity.PasswordResetToken;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    /**
     * Mã mới nhất của người dùng, khóa dòng (SELECT ... FOR UPDATE) để hai request song song không
     * cùng tăng {@code attempts} vượt giới hạn.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    void deleteAllByUserId(Long userId);

    @Modifying
    @Query("delete from PasswordResetToken t where t.createdAt < :cutoff")
    int deleteCreatedBefore(@Param("cutoff") LocalDateTime cutoff);
}
