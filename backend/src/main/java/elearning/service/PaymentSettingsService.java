package elearning.service;

import elearning.dto.PaymentDto.SettingsRequest;
import elearning.dto.PaymentDto.SettingsResponse;
import elearning.entity.PaymentSettings;
import elearning.entity.User;
import elearning.repository.PaymentSettingsRepository;
import elearning.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Tài khoản nhận tiền của trung tâm. Giá trị mặc định lấy từ .env (PAYMENT_*), chỉ dùng để tạo
 * dòng đầu tiên khi bảng payment_settings còn trống; sau đó admin sửa trong trang Cài đặt thanh toán.
 */
@Service
@Transactional
public class PaymentSettingsService {
    private static final Logger log = LoggerFactory.getLogger(PaymentSettingsService.class);

    private final PaymentSettingsRepository repository;
    private final UserRepository users;
    private final String defaultBin;
    private final String defaultBankName;
    private final String defaultAccountNo;
    private final String defaultAccountName;

    public PaymentSettingsService(
            PaymentSettingsRepository repository,
            UserRepository users,
            @Value("${app.payment.bank-bin:}") String defaultBin,
            @Value("${app.payment.bank-name:}") String defaultBankName,
            @Value("${app.payment.account-no:}") String defaultAccountNo,
            @Value("${app.payment.account-name:}") String defaultAccountName) {
        this.repository = repository;
        this.users = users;
        this.defaultBin = defaultBin.trim();
        this.defaultBankName = defaultBankName.trim();
        this.defaultAccountNo = defaultAccountNo.trim();
        this.defaultAccountName = defaultAccountName.trim();
    }

    /** Khi khởi động: bảng trống và .env có đủ thông tin hợp lệ → tạo dòng cài đặt đầu tiên. */
    @EventListener(ApplicationReadyEvent.class)
    public void seedFromEnvironment() {
        if (repository.count() > 0) return;
        if (!defaultBin.matches("\\d{6}")
                || defaultBankName.isBlank()
                || !defaultAccountNo.matches("\\d{6,19}")
                || !defaultAccountName.matches("[A-Z ]+")) {
            log.warn("Chưa có cài đặt thanh toán và PAYMENT_* trong .env chưa hợp lệ — học viên chưa mua khóa trả phí được.");
            return;
        }
        PaymentSettings settings = new PaymentSettings();
        settings.setBankBin(defaultBin);
        settings.setBankName(defaultBankName);
        settings.setAccountNo(defaultAccountNo);
        settings.setAccountName(defaultAccountName);
        repository.save(settings);
        log.info("Đã tạo cài đặt thanh toán từ .env ({} – {})", defaultBankName, maskAccount(defaultAccountNo));
    }

    @Transactional(readOnly = true)
    public PaymentSettings current() {
        return repository
                .findFirstByOrderByIdAsc()
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Trung tâm chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ quản trị viên."));
    }

    @Transactional(readOnly = true)
    public SettingsResponse get() {
        return repository.findFirstByOrderByIdAsc().map(this::response).orElse(null);
    }

    public SettingsResponse update(String adminEmail, SettingsRequest request) {
        PaymentSettings settings = repository.findFirstByOrderByIdAsc().orElseGet(PaymentSettings::new);
        settings.setBankBin(request.bankBin().trim());
        settings.setBankName(request.bankName().trim());
        settings.setAccountNo(request.accountNo().trim());
        settings.setAccountName(request.accountName().trim().replaceAll("\\s+", " "));
        settings.setTransferPrefix(request.transferPrefix().trim());
        settings.setOrderExpiryHours(request.orderExpiryHours());
        settings.setNote(request.note() == null || request.note().isBlank() ? null : request.note().trim());
        settings.setUpdatedBy(users.findByEmailIgnoreCase(adminEmail).orElse(null));
        return response(repository.save(settings));
    }

    /** Ảnh QR động VietQR Quick Link (có số tiền và nội dung chuyển khoản), không cần API key. */
    public static String qrImageUrl(PaymentSettings s, long amount, String transferContent) {
        return "https://img.vietqr.io/image/"
                + s.getBankBin()
                + "-"
                + s.getAccountNo()
                + "-compact2.png?amount="
                + amount
                + "&addInfo="
                + encode(transferContent)
                + "&accountName="
                + encode(s.getAccountName());
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String maskAccount(String accountNo) {
        return "***" + accountNo.substring(Math.max(0, accountNo.length() - 4));
    }

    private SettingsResponse response(PaymentSettings s) {
        User by = s.getUpdatedBy();
        return new SettingsResponse(
                s.getBankBin(),
                s.getBankName(),
                s.getAccountNo(),
                s.getAccountName(),
                s.getTransferPrefix(),
                s.getOrderExpiryHours(),
                s.getNote(),
                s.getUpdatedAt(),
                by == null ? null : by.getFullName(),
                qrImageUrl(s, 10_000, "TPTEST01"));
    }
}
