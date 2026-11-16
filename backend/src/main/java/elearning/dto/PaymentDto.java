package elearning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** Mua khóa học: đơn hàng, xác nhận chuyển khoản, doanh thu, cài đặt nhận tiền. Tiền tính bằng đồng (Long). */
public final class PaymentDto {
    private PaymentDto() {}

    public record CreateOrderRequest(@NotNull @Positive Long courseId) {}

    public record BankInfo(String bankName, String accountNo, String accountName) {}

    public record ReceiptResponse(
            Long receivedAmount,
            String bankTransactionRef,
            LocalDateTime receivedAt,
            String confirmedByName,
            LocalDateTime confirmedAt,
            String adminNote) {}

    public record HistoryResponse(
            String fromStatus, String toStatus, String changedByName, String reason, LocalDateTime createdAt) {}

    /**
     * Đơn hàng. statusReason: lý do của trạng thái hiện tại (từ chối, hoàn tiền, hết hạn...).
     * bank / qrImageUrl chỉ có khi đơn còn chờ chuyển khoản. receipt / history chỉ có ở trang chi tiết.
     */
    public record OrderResponse(
            Long id,
            String orderCode,
            Long courseId,
            String courseTitle,
            Long studentId,
            String studentName,
            String studentEmail,
            Long amount,
            String status,
            String paymentMethod,
            String transferContent,
            LocalDateTime expiresAt,
            LocalDateTime studentReportedAt,
            String studentNote,
            boolean hasProof,
            String statusReason,
            BankInfo bank,
            String qrImageUrl,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ReceiptResponse receipt,
            List<HistoryResponse> history) {}

    public record OrderPage(List<OrderResponse> items, long total, int page, int size) {}

    public record OrderCounts(long awaitingConfirmation) {}

    public record ConfirmRequest(
            @NotNull @PositiveOrZero Long receivedAmount,
            @Size(max = 100) String bankTransactionRef,
            LocalDateTime receivedAt,
            @Size(max = 2000) String note,
            boolean force) {}

    public record RejectRequest(@NotBlank @Size(max = 2000) String reason) {}

    public record PriceRequest(@NotNull @PositiveOrZero @Max(1_000_000_000L) Long price) {}

    public record SettingsRequest(
            @NotBlank @Pattern(regexp = "\\d{6}", message = "Mã ngân hàng (BIN) gồm đúng 6 chữ số") String bankBin,
            @NotBlank @Size(max = 100) String bankName,
            @NotBlank @Pattern(regexp = "\\d{6,19}", message = "Số tài khoản gồm 6–19 chữ số") String accountNo,
            @NotBlank
                    @Size(max = 100)
                    @Pattern(regexp = "[A-Z ]+", message = "Tên chủ tài khoản chỉ gồm chữ in hoa không dấu và khoảng trắng")
                    String accountName,
            @NotBlank @Pattern(regexp = "[A-Z0-9]{1,6}", message = "Tiền tố gồm 1–6 chữ in hoa hoặc số") String transferPrefix,
            @NotNull @Min(1) @Max(720) Integer orderExpiryHours,
            @Size(max = 2000) String note) {}

    public record SettingsResponse(
            String bankBin,
            String bankName,
            String accountNo,
            String accountName,
            String transferPrefix,
            Integer orderExpiryHours,
            String note,
            LocalDateTime updatedAt,
            String updatedByName,
            /** QR mẫu 10.000đ, nội dung TPTEST01 — admin quét thử trước khi mở bán. */
            String sampleQrImageUrl) {}

    public record PreviewWeek(Integer weekNumber, String title, List<String> lessons) {}

    /** Trạng thái mua khóa học của học viên ở trang khóa học. */
    public record CoursePurchaseResponse(
            Long courseId,
            Long price,
            boolean free,
            boolean purchased,
            boolean hasOpenClass,
            Long enrolledClassId,
            String enrolledClassName,
            OrderResponse openOrder,
            OrderResponse lastClosedOrder,
            long lessonCount,
            long questionCount,
            List<PreviewWeek> preview) {}

    public record MonthRevenue(String month, long net, long orders) {}

    public record CourseRevenue(Long courseId, String courseTitle, long orders, long net) {}

    public record RevenueResponse(
            long netRevenue,
            long paidOrders,
            long awaitingAmount,
            long awaitingCount,
            List<MonthRevenue> monthly,
            List<CourseRevenue> byCourse) {}
}
