package elearning.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Mỗi giờ: xóa mã đặt lại mật khẩu cũ hơn 1 ngày (qua AuthService để có transaction). */
@Component
public class PasswordResetCleanupJob {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetCleanupJob.class);
    private final AuthService auth;

    public PasswordResetCleanupJob(AuthService auth) {
        this.auth = auth;
    }

    @Scheduled(fixedDelay = 60 * 60 * 1000L, initialDelay = 5 * 60 * 1000L)
    public void run() {
        int removed = auth.purgeOldResetCodes();
        if (removed > 0) log.info("Đã xóa {} mã đặt lại mật khẩu cũ", removed);
    }
}
