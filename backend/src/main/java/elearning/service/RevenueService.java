package elearning.service;

import elearning.dto.PaymentDto.CourseRevenue;
import elearning.dto.PaymentDto.MonthRevenue;
import elearning.dto.PaymentDto.RevenueResponse;
import elearning.entity.CourseOrder;
import elearning.entity.PaymentReceipt;
import elearning.repository.CourseOrderRepository;
import elearning.repository.PaymentReceiptRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Doanh thu tính trực tiếp từ payment_receipts (received_amount), không lưu cột
 * tổng. Đơn MIGRATED (0đ, chuyển đổi dữ liệu cũ) không tính vào số đơn bán được.
 *
 * <p>ponytail: cộng dồn trong Java trên danh sách receipt của khoảng ngày; đủ cho vài chục nghìn
 * giao dịch, chuyển sang GROUP BY trong SQL nếu lớn hơn.
 */
@Service
@Transactional(readOnly = true)
public class RevenueService {
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final PaymentReceiptRepository receipts;
    private final CourseOrderRepository orders;

    public RevenueService(PaymentReceiptRepository receipts, CourseOrderRepository orders) {
        this.receipts = receipts;
        this.orders = orders;
    }

    public RevenueResponse summary(LocalDate from, LocalDate to) {
        List<PaymentReceipt> rows = sales(from, to);
        Map<String, long[]> monthly = new TreeMap<>();
        Map<Long, CourseRevenue> byCourse = new LinkedHashMap<>();
        long net = 0;
        for (PaymentReceipt r : rows) {
            long value = r.getReceivedAmount();
            net += value;
            long[] month = monthly.computeIfAbsent(r.getReceivedAt().format(MONTH), k -> new long[2]);
            month[0] += value;
            month[1]++;
            var course = r.getOrder().getCourse();
            CourseRevenue old = byCourse.get(course.getId());
            byCourse.put(
                    course.getId(),
                    new CourseRevenue(
                            course.getId(),
                            course.getTitle(),
                            (old == null ? 0 : old.orders()) + 1,
                            (old == null ? 0 : old.net()) + value));
        }
        List<MonthRevenue> months = new ArrayList<>();
        monthly.forEach((month, v) -> months.add(new MonthRevenue(month, v[0], v[1])));
        List<CourseRevenue> courses = new ArrayList<>(byCourse.values());
        courses.sort((a, b) -> Long.compare(b.net(), a.net()));
        long paid = rows.stream().filter(r -> r.getOrder().getStatus() == CourseOrder.Status.PAID).count();
        return new RevenueResponse(
                net,
                paid,
                orders.sumAmountByStatus(CourseOrder.Status.AWAITING_CONFIRMATION),
                orders.countByStatus(CourseOrder.Status.AWAITING_CONFIRMATION),
                months,
                courses);
    }

    /** CSV các giao dịch (UTF-8 có BOM để Excel đọc đúng tiếng Việt). */
    public String csv(LocalDate from, LocalDate to) {
        StringBuilder out = new StringBuilder("﻿");
        out.append("Mã đơn,Nội dung CK,Học viên,Email,Khóa học,Hình thức,Số tiền đơn,Đã nhận,Mã GD ngân hàng,Thời điểm nhận,Người xác nhận,Trạng thái\n");
        for (PaymentReceipt r : sales(from, to)) {
            CourseOrder o = r.getOrder();
            out.append(String.join(
                            ",",
                            csvCell(o.getOrderCode()),
                            csvCell(o.getTransferContent()),
                            csvCell(o.getStudent().getFullName()),
                            csvCell(o.getStudent().getEmail()),
                            csvCell(o.getCourse().getTitle()),
                            o.getPaymentMethod().name(),
                            String.valueOf(o.getAmount()),
                            String.valueOf(r.getReceivedAmount()),
                            csvCell(r.getBankTransactionRef()),
                            r.getReceivedAt().format(TIME),
                            csvCell(r.getConfirmedBy() == null ? "Hệ thống" : r.getConfirmedBy().getFullName()),
                            o.getStatus().name()))
                    .append('\n');
        }
        return out.toString();
    }

    private List<PaymentReceipt> sales(LocalDate from, LocalDate to) {
        LocalDateTime start = from == null ? null : from.atStartOfDay();
        LocalDateTime end = to == null ? null : to.plusDays(1).atStartOfDay();
        return receipts.findReceived(start, end).stream()
                .filter(r -> r.getOrder().getPaymentMethod() != CourseOrder.PaymentMethod.MIGRATED)
                .toList();
    }

    /** Bọc ô CSV, chặn công thức Excel (=, +, -, @) để tránh CSV injection. */
    static String csvCell(String value) {
        if (value == null) return "";
        String safe = value.matches("^[=+\\-@].*") ? "'" + value : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
