package elearning.controller;

import elearning.dto.PaymentDto.ConfirmRequest;
import elearning.dto.PaymentDto.OrderCounts;
import elearning.dto.PaymentDto.OrderPage;
import elearning.dto.PaymentDto.OrderResponse;
import elearning.dto.PaymentDto.RejectRequest;
import elearning.dto.PaymentDto.RevenueResponse;
import elearning.dto.PaymentDto.SettingsRequest;
import elearning.dto.PaymentDto.SettingsResponse;
import elearning.service.MediaStorageService;
import elearning.service.OrderService;
import elearning.service.PaymentSettingsService;
import elearning.service.RevenueService;

import jakarta.validation.Valid;

import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.time.LocalDate;

/** Đơn hàng, doanh thu và cài đặt nhận tiền — chỉ ADMIN. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {
    private final OrderService orders;
    private final RevenueService revenue;
    private final PaymentSettingsService settings;
    private final MediaStorageService media;

    public AdminOrderController(
            OrderService orders,
            RevenueService revenue,
            PaymentSettingsService settings,
            MediaStorageService media) {
        this.orders = orders;
        this.revenue = revenue;
        this.settings = settings;
        this.media = media;
    }

    @GetMapping("/orders")
    public OrderPage list(
            @RequestParam(defaultValue = "AWAITING_CONFIRMATION") String tab,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return orders.search(tab, q, courseId, from, to, page, size);
    }

    @GetMapping("/orders/counts")
    public OrderCounts counts() {
        return orders.counts();
    }

    @GetMapping("/orders/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return orders.adminOrder(id);
    }

    @GetMapping("/orders/{id}/proof")
    public ResponseEntity<Resource> proof(@PathVariable Long id) {
        String url = orders.adminProof(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.contentType(url)))
                .header("Cache-Control", "private, no-store")
                .body(media.load(url));
    }

    @PostMapping("/orders/{id}/confirm")
    public OrderResponse confirm(
            Principal p, @PathVariable Long id, @Valid @RequestBody ConfirmRequest request) {
        return orders.confirm(p.getName(), id, request);
    }

    @PostMapping("/orders/{id}/reject")
    public OrderResponse reject(
            Principal p, @PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        return orders.reject(p.getName(), id, request.reason());
    }

    @GetMapping("/revenue")
    public RevenueResponse revenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return revenue.summary(from, to);
    }

    @GetMapping("/revenue/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        String name =
                "giao-dich" + (from == null ? "" : "-" + from) + (to == null ? "" : "-" + to) + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(revenue.csv(from, to).getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/payment-settings")
    public SettingsResponse settings() {
        return settings.get();
    }

    @PutMapping("/payment-settings")
    public SettingsResponse updateSettings(
            Principal p, @Valid @RequestBody SettingsRequest request) {
        return settings.update(p.getName(), request);
    }
}
