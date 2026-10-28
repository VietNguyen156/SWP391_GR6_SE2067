package elearning.repository;

import elearning.entity.PaymentSettings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentSettingsRepository extends JpaRepository<PaymentSettings, Long> {
    Optional<PaymentSettings> findFirstByOrderByIdAsc();
}
