package elearning.repository;

import elearning.entity.RefreshToken;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** SELECT ... FOR UPDATE: hai lần làm mới cùng một token chạy lần lượt, lần sau thấy token đã thu hồi. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from RefreshToken t where t.tokenHash = :hash")
    Optional<RefreshToken> lockByTokenHash(@Param("hash") String tokenHash);

    List<RefreshToken> findAllByUserIdAndRevokedAtIsNull(Long userId);
}
