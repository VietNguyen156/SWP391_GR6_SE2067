package elearning.controller;

import elearning.dto.PaymentDto.CoursePurchaseResponse;
import elearning.dto.PaymentDto.CreateOrderRequest;
import elearning.dto.PaymentDto.OrderResponse;
import elearning.service.OrderService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

/** Mua khóa học (chỉ học viên; giáo viên và admin không tạo đơn). */
@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentOrderController {
    private final OrderService orders;

    public StudentOrderController(OrderService orders) {
        this.orders = orders;
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(Principal p, @Valid @RequestBody CreateOrderRequest request) {
        return orders.create(p.getName(), request.courseId());
    }

    @GetMapping("/orders")
    public List<OrderResponse> list(Principal p) {
        return orders.studentOrders(p.getName());
    }

    @GetMapping("/orders/{code}")
    public OrderResponse get(Principal p, @PathVariable String code) {
        return orders.studentOrder(p.getName(), code);
    }

    @PostMapping(value = "/orders/{id}/report-paid", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OrderResponse reportPaid(
            Principal p,
            @PathVariable Long id,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) MultipartFile proof)
            throws IOException {
        return orders.reportPaid(p.getName(), id, note, proof);
    }

    @PostMapping("/orders/{id}/cancel")
    public OrderResponse cancel(Principal p, @PathVariable Long id) {
        return orders.cancel(p.getName(), id);
    }

    @GetMapping("/courses/{courseId}/purchase")
    public CoursePurchaseResponse purchase(Principal p, @PathVariable Long courseId) {
        return orders.coursePurchase(p.getName(), courseId);
    }
}
