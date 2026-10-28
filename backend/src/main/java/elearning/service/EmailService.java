package elearning.service;

import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Gửi email của hệ thống. Chạy bất đồng bộ để không làm chậm request và để thời gian phản hồi không
 * phụ thuộc email có tồn tại hay không. Lỗi gửi chỉ được ghi log, không ném ra cho người gọi.
 */
@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender sender;
    private final String username;
    private final String from;
    private final boolean exposeCodeInLog;

    public EmailService(
            JavaMailSender sender,
            @Value("${spring.mail.username:}") String username,
            @Value("${app.mail.from:}") String from,
            @Value("${app.auth.expose-reset-token:false}") boolean exposeCodeInLog) {
        this.sender = sender;
        this.username = username == null ? "" : username.trim();
        this.from = from == null ? "" : from.trim();
        this.exposeCodeInLog = exposeCodeInLog;
    }

    /** Đã cấu hình SMTP (có MAIL_USERNAME) thì mới gửi thật. */
    boolean configured() {
        return !username.isEmpty();
    }

    @Async
    public void sendResetCode(String to, String code, int validMinutes) {
        if (!configured()) {
            log.warn("Chưa cấu hình SMTP (MAIL_USERNAME rỗng): không gửi email đặt lại mật khẩu tới {}", mask(to));
            // Chỉ để dev thử cục bộ khi bật rõ ràng; mặc định không bao giờ lộ mã.
            if (exposeCodeInLog) log.info("[DEV] Mã đặt lại mật khẩu của {}: {}", mask(to), code);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from.isEmpty() ? username : from);
            helper.setTo(to);
            helper.setSubject("Mã đặt lại mật khẩu TOEIC Path");
            helper.setText(body(code, validMinutes), false);
            sender.send(message);
        } catch (Exception error) {
            log.error("Không gửi được email đặt lại mật khẩu tới {}", mask(to), error);
        }
    }

    static String body(String code, int validMinutes) {
        return "Xin chào,\n\n"
                + "Mã xác nhận đặt lại mật khẩu TOEIC Path của bạn là:\n\n"
                + "    " + code + "\n\n"
                + "Mã có hiệu lực trong " + validMinutes + " phút và chỉ dùng được một lần.\n"
                + "Nếu không phải bạn yêu cầu, hãy bỏ qua email này; mật khẩu của bạn không bị thay đổi.\n\n"
                + "TOEIC Path";
    }

    /** a***@domain: đủ để dev nhận ra, không ghi nguyên địa chỉ vào log. */
    static String mask(String email) {
        int at = email == null ? -1 : email.indexOf('@');
        return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}
