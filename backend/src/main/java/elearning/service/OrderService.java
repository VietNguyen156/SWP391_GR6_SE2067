package elearning.service;

import elearning.dto.PaymentDto.BankInfo;
import elearning.dto.PaymentDto.ConfirmRequest;
import elearning.dto.PaymentDto.CoursePurchaseResponse;
import elearning.dto.PaymentDto.HistoryResponse;
import elearning.dto.PaymentDto.OrderCounts;
import elearning.dto.PaymentDto.OrderPage;
import elearning.dto.PaymentDto.OrderResponse;
import elearning.dto.PaymentDto.PreviewWeek;
import elearning.dto.PaymentDto.ReceiptResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.ClassRoom;
import elearning.entity.Course;
import elearning.entity.CourseOrder;
import elearning.entity.CourseOrder.PaymentMethod;
import elearning.entity.CourseOrder.Status;
import elearning.entity.CourseWeek;
import elearning.entity.Lesson;
import elearning.entity.OrderStatusHistory;
import elearning.entity.PaymentReceipt;
import elearning.entity.PaymentSettings;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ResourceNotFoundException;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.ClassRoomRepository;
import elearning.repository.CourseOrderRepository;
import elearning.repository.CourseRepository;
import elearning.repository.CourseWeekRepository;
import elearning.repository.LessonRepository;
import elearning.repository.OrderStatusHistoryRepository;
import elearning.repository.PaymentReceiptRepository;
import elearning.repository.QuizRepository;
import elearning.repository.UserRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Mua khóa học: tạo đơn → học viên chuyển khoản (QR) → admin xác nhận thủ công → được chọn lớp.
 * Mọi thay đổi trạng thái đi qua {@link #transition}: khóa dòng đơn, kiểm tra theo
 * {@link Status#canMoveTo} và ghi {@code order_status_history}.
 */
@Service
@Transactional
public class OrderService {
    static final long MAX_PROOF_BYTES = 5L * 1024 * 1024;
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ O/0, I/1
    private static final Set<Status> OPEN = EnumSet.of(Status.PENDING, Status.AWAITING_CONFIRMATION);
    /** Nhóm trạng thái cho các tab của trang admin. */
    static final Map<String, Set<Status>> ADMIN_TABS =
            Map.of(
                    "AWAITING_CONFIRMATION", EnumSet.of(Status.AWAITING_CONFIRMATION),
                    "PENDING", EnumSet.of(Status.PENDING),
                    "PAID", EnumSet.of(Status.PAID),
                    "CLOSED", EnumSet.of(Status.REJECTED, Status.CANCELLED, Status.EXPIRED));

    private final SecureRandom random = new SecureRandom();
    private final CourseOrderRepository orders;
    private final PaymentReceiptRepository receipts;
    private final OrderStatusHistoryRepository history;
    private final UserRepository users;
    private final CourseRepository courses;
    private final ClassRoomRepository classes;
    private final ClassEnrollmentRepository enrollments;
    private final CourseWeekRepository weeks;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final PaymentSettingsService settings;
    private final MediaStorageService media;

    public OrderService(
            CourseOrderRepository orders,
            PaymentReceiptRepository receipts,
            OrderStatusHistoryRepository history,
            UserRepository users,
            CourseRepository courses,
            ClassRoomRepository classes,
            ClassEnrollmentRepository enrollments,
            CourseWeekRepository weeks,
            LessonRepository lessons,
            QuizRepository quizzes,
            PaymentSettingsService settings,
            MediaStorageService media) {
        this.orders = orders;
        this.receipts = receipts;
        this.history = history;
        this.users = users;
        this.courses = courses;
        this.classes = classes;
        this.enrollments = enrollments;
        this.weeks = weeks;
        this.lessons = lessons;
        this.quizzes = quizzes;
        this.settings = settings;
        this.media = media;
    }

    // ===================== Học viên =====================

    public OrderResponse create(String email, Long courseId) {
        User student = student(email);
        users.lockById(student.getId()); // tuần tự hóa: không thể có hai đơn mở cho cùng một khóa
        Course course =
                courses.findByIdAndStatus(courseId, Course.Status.PUBLISHED)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học"));
        if (orders.existsByStudentIdAndCourseIdAndStatus(student.getId(), courseId, Status.PAID)) {
            throw new IllegalArgumentException("Bạn đã mua khóa học này");
        }
        for (CourseOrder open : orders.findAllByStudentIdAndCourseIdAndStatusIn(student.getId(), courseId, OPEN)) {
            if (!expireIfOverdue(open)) return response(open, false);
        }
        if (!hasOpenSeat(courseId)) throw new IllegalArgumentException("Khóa học chưa có lớp mở");

        CourseOrder order = new CourseOrder();
        order.setStudent(student);
        order.setCourse(course);
        order.setOrderCode(newCode());
        order.setAmount(course.getPrice() == null ? 0L : course.getPrice());
        if (order.getAmount() == 0) {
            order.setPaymentMethod(PaymentMethod.FREE);
            order.setStatus(Status.PAID);
            order.setTransferContent(order.getOrderCode());
            orders.save(order);
            log(order, null, Status.PAID, null, "Khóa học miễn phí");
            receipt(order, 0L, null, LocalDateTime.now(), null, "Khóa học miễn phí");
            return response(order, false);
        }
        PaymentSettings s = settings.current();
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setStatus(Status.PENDING);
        order.setTransferContent(s.getTransferPrefix() + order.getOrderCode());
        order.setExpiresAt(LocalDateTime.now().plusHours(s.getOrderExpiryHours()));
        orders.save(order);
        log(order, null, Status.PENDING, student, "Học viên tạo đơn");
        return response(order, false);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> studentOrders(String email) {
        User student = student(email);
        return orders.findAllByStudentIdOrderByCreatedAtDescIdDesc(student.getId()).stream()
                .map(o -> response(o, false))
                .toList();
    }

    public OrderResponse studentOrder(String email, String code) {
        User student = student(email);
        CourseOrder order =
                orders.findByOrderCodeAndStudentId(code.trim().toUpperCase(), student.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        expireIfOverdue(order);
        return response(order, true);
    }

    public OrderResponse reportPaid(String email, Long id, String note, MultipartFile proof) throws IOException {
        User student = student(email);
        CourseOrder order = ownedLocked(student, id);
        if (expireIfOverdue(order)) throw new IllegalArgumentException("Đơn đã hết hạn thanh toán. Vui lòng tạo đơn mới.");
        if (order.getStatus() != Status.PENDING)
            throw new IllegalArgumentException("Chỉ báo đã chuyển khoản cho đơn đang chờ thanh toán");
        if (proof != null && !proof.isEmpty()) order.setProofUrl(media.storeImage(proof, "payment-proofs", MAX_PROOF_BYTES));
        order.setStudentNote(clean(note));
        order.setStudentReportedAt(LocalDateTime.now());
        transition(order, Status.AWAITING_CONFIRMATION, student, "Học viên báo đã chuyển khoản");
        return response(order, true);
    }

    public OrderResponse cancel(String email, Long id) {
        User student = student(email);
        CourseOrder order = ownedLocked(student, id);
        if (order.getStatus() != Status.PENDING) throw new IllegalArgumentException("Chỉ hủy được đơn đang chờ thanh toán");
        transition(order, Status.CANCELLED, student, "Học viên hủy đơn");
        return response(order, true);
    }

    /** Trạng thái mua khóa của học viên + lộ trình xem trước (tên tuần, tên bài) cho trang khóa học. */
    public CoursePurchaseResponse coursePurchase(String email, Long courseId) {
        User student = student(email);
        Course course =
                courses.findByIdAndStatus(courseId, Course.Status.PUBLISHED)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học"));
        List<CourseOrder> mine = orders.findAllByStudentIdAndCourseIdOrderByCreatedAtDescIdDesc(student.getId(), courseId);
        mine.forEach(this::expireIfOverdue);
        boolean purchased = mine.stream().anyMatch(o -> o.getStatus() == Status.PAID);
        CourseOrder open = mine.stream().filter(o -> o.getStatus().isOpen()).findFirst().orElse(null);
        CourseOrder lastClosed =
                purchased || open != null
                        ? null
                        : mine.stream()
                                .filter(o -> EnumSet.of(Status.REJECTED, Status.EXPIRED).contains(o.getStatus()))
                                .findFirst()
                                .orElse(null);
        ClassEnrollment enrolled =
                enrollments.findAllByStudentIdAndClassroomCourseId(student.getId(), courseId).stream()
                        .filter(e -> e.getStatus() == ClassEnrollment.Status.ACTIVE)
                        .findFirst()
                        .orElse(null);
        List<PreviewWeek> preview =
                weeks.findAllByCourseIdOrderByWeekNumberAsc(courseId).stream()
                        .filter(w -> w.getStatus() == CourseWeek.Status.PUBLISHED)
                        .map(w -> new PreviewWeek(
                                w.getWeekNumber(),
                                w.getTitle(),
                                lessons.findAllByCourseWeekIdOrderBySortOrderAsc(w.getId()).stream()
                                        .filter(l -> l.getStatus() == Lesson.Status.PUBLISHED)
                                        .map(Lesson::getTitle)
                                        .toList()))
                        .toList();
        long lessonCount = preview.stream().mapToLong(w -> w.lessons().size()).sum();
        long price = course.getPrice() == null ? 0 : course.getPrice();
        return new CoursePurchaseResponse(
                courseId,
                price,
                price == 0,
                purchased,
                hasOpenSeat(courseId),
                enrolled == null ? null : enrolled.getClassroom().getId(),
                enrolled == null ? null : enrolled.getClassroom().getClassName(),
                open == null ? null : response(open, false),
                lastClosed == null ? null : response(lastClosed, false),
                lessonCount,
                quizzes.countQuestionsOfPublishedCourseQuizzes(courseId),
                preview);
    }

    /** Có ít nhất một lớp đang nhận học viên và còn chỗ. */
    @Transactional(readOnly = true)
    public boolean hasOpenSeat(Long courseId) {
        return classes.findAllByCourseId(courseId).stream()
                .filter(room -> room.getStatus() == ClassRoom.Status.OPEN)
                .anyMatch(room -> room.getMaxStudents() == null
                        || enrollments.countByClassroomIdAndStatus(room.getId(), ClassEnrollment.Status.ACTIVE)
                                < room.getMaxStudents());
    }

    // ===================== Admin =====================

    @Transactional(readOnly = true)
    public OrderPage search(String tab, String q, Long courseId, LocalDate from, LocalDate to, int page, int size) {
        Set<Status> statuses = ADMIN_TABS.getOrDefault(tab == null ? "AWAITING_CONFIRMATION" : tab, ADMIN_TABS.get("AWAITING_CONFIRMATION"));
        String needle = q == null || q.isBlank() ? "" : "%" + q.trim().toLowerCase() + "%";
        Sort sort = statuses.contains(Status.AWAITING_CONFIRMATION)
                ? Sort.by(Sort.Order.asc("studentReportedAt"), Sort.Order.asc("id"))
                : Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        var result = orders.search(
                statuses,
                courseId,
                from == null ? null : from.atStartOfDay(),
                to == null ? null : to.plusDays(1).atStartOfDay(),
                needle,
                PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), sort));
        return new OrderPage(
                result.getContent().stream().map(o -> response(o, false)).toList(),
                result.getTotalElements(),
                result.getNumber(),
                result.getSize());
    }

    @Transactional(readOnly = true)
    public OrderResponse adminOrder(Long id) {
        return response(find(id), true);
    }

    @Transactional(readOnly = true)
    public OrderCounts counts() {
        return new OrderCounts(orders.countByStatus(Status.AWAITING_CONFIRMATION));
    }

    @Transactional(readOnly = true)
    public String adminProof(Long id) {
        return proofOf(find(id));
    }

    /** Idempotent: đơn đã PAID thì trả kết quả cũ, không tạo receipt trùng. */
    public OrderResponse confirm(String adminEmail, Long id, ConfirmRequest request) {
        User admin = admin(adminEmail);
        CourseOrder order = locked(id);
        if (order.getStatus() == Status.PAID) return response(order, true);
        requireTransition(order, Status.PAID);
        String note = clean(request.note());
        if (!request.receivedAmount().equals(order.getAmount()) && !(request.force() && note != null)) {
            throw new IllegalArgumentException(
                    "Số tiền nhận (" + request.receivedAmount() + "đ) khác số tiền đơn (" + order.getAmount()
                            + "đ). Hãy kiểm tra lại, hoặc xác nhận kèm ghi chú giải thích.");
        }
        LocalDateTime receivedAt = request.receivedAt() == null ? LocalDateTime.now() : request.receivedAt();
        if (receivedAt.isAfter(LocalDateTime.now().plusMinutes(5)))
            throw new IllegalArgumentException("Thời điểm nhận tiền không được ở tương lai");
        receipt(order, request.receivedAmount(), clean(request.bankTransactionRef()), receivedAt, admin, note);
        transition(order, Status.PAID, admin, note == null ? "Admin xác nhận đã nhận tiền" : note);
        return response(order, true);
    }

    public OrderResponse reject(String adminEmail, Long id, String reason) {
        User admin = admin(adminEmail);
        CourseOrder order = locked(id);
        transition(order, Status.REJECTED, admin, reason.trim());
        return response(order, true);
    }

    // ===================== Hệ thống =====================

    /** Đơn PENDING quá hạn → EXPIRED. Đơn AWAITING_CONFIRMATION không tự hết hạn. */
    public int expireOverdue() {
        int count = 0;
        for (CourseOrder candidate : orders.findAllByStatusAndExpiresAtBefore(Status.PENDING, LocalDateTime.now())) {
            CourseOrder order = locked(candidate.getId());
            if (expireIfOverdue(order)) count++;
        }
        return count;
    }

    // ===================== Nội bộ =====================

    /** Đổi trạng thái theo bảng chuyển trạng thái và ghi lịch sử. actor null = hệ thống. */
    void transition(CourseOrder order, Status to, User actor, String reason) {
        Status from = order.getStatus();
        requireTransition(order, to);
        order.setStatus(to);
        orders.save(order);
        log(order, from, to, actor, reason);
    }

    private static void requireTransition(CourseOrder order, Status to) {
        if (!order.getStatus().canMoveTo(to))
            throw new IllegalArgumentException(
                    "Không thể chuyển đơn " + order.getOrderCode() + " từ " + label(order.getStatus()) + " sang " + label(to));
    }

    private boolean expireIfOverdue(CourseOrder order) {
        if (order.getStatus() != Status.PENDING || order.getExpiresAt() == null
                || order.getExpiresAt().isAfter(LocalDateTime.now())) return false;
        transition(order, Status.EXPIRED, null, "Quá hạn thanh toán");
        return true;
    }

    private void log(CourseOrder order, Status from, Status to, User actor, String reason) {
        OrderStatusHistory row = new OrderStatusHistory();
        row.setOrder(order);
        row.setFromStatus(from);
        row.setToStatus(to);
        row.setChangedBy(actor);
        row.setReason(reason);
        history.save(row);
    }

    private void receipt(CourseOrder order, Long amount, String ref, LocalDateTime receivedAt, User admin, String note) {
        PaymentReceipt receipt = new PaymentReceipt();
        receipt.setOrder(order);
        receipt.setReceivedAmount(amount);
        receipt.setBankTransactionRef(ref);
        receipt.setReceivedAt(receivedAt);
        receipt.setConfirmedBy(admin);
        receipt.setConfirmedAt(LocalDateTime.now());
        receipt.setAdminNote(note);
        receipts.save(receipt);
    }

    private String newCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder code = new StringBuilder(8);
            for (int i = 0; i < 8; i++) code.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            if (!orders.existsByOrderCode(code.toString())) return code.toString();
        }
        throw new IllegalStateException("Không tạo được mã đơn hàng, vui lòng thử lại");
    }

    private CourseOrder ownedLocked(User student, Long id) {
        CourseOrder order = locked(id);
        if (!order.getStudent().getId().equals(student.getId())) throw new ResourceNotFoundException("Không tìm thấy đơn hàng");
        return order;
    }

    private CourseOrder locked(Long id) {
        return orders.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
    }

    private CourseOrder find(Long id) {
        return orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
    }

    private static String proofOf(CourseOrder order) {
        if (order.getProofUrl() == null) throw new ResourceNotFoundException("Đơn hàng không có ảnh biên lai");
        return order.getProofUrl();
    }

    OrderResponse response(CourseOrder o, boolean detail) {
        boolean awaitingTransfer = o.getStatus() == Status.PENDING && o.getPaymentMethod() == PaymentMethod.BANK_TRANSFER;
        PaymentSettings s = awaitingTransfer ? settings.current() : null;
        String reason = history.findFirstByOrderIdAndToStatusOrderByCreatedAtDescIdDesc(o.getId(), o.getStatus())
                .map(OrderStatusHistory::getReason)
                .orElse(null);
        ReceiptResponse receipt = null;
        List<HistoryResponse> rows = null;
        if (detail) {
            receipt = receipts.findByOrderId(o.getId()).map(OrderService::receiptResponse).orElse(null);
            rows = history.findAllByOrderIdOrderByCreatedAtAscIdAsc(o.getId()).stream()
                    .map(h -> new HistoryResponse(
                            h.getFromStatus() == null ? null : h.getFromStatus().name(),
                            h.getToStatus().name(),
                            h.getChangedBy() == null ? "Hệ thống" : h.getChangedBy().getFullName(),
                            h.getReason(),
                            h.getCreatedAt()))
                    .toList();
        }
        User student = o.getStudent();
        return new OrderResponse(
                o.getId(),
                o.getOrderCode(),
                o.getCourse().getId(),
                o.getCourse().getTitle(),
                student.getId(),
                student.getFullName(),
                student.getEmail(),
                o.getAmount(),
                o.getStatus().name(),
                o.getPaymentMethod().name(),
                o.getTransferContent(),
                o.getExpiresAt(),
                o.getStudentReportedAt(),
                o.getStudentNote(),
                o.getProofUrl() != null,
                reason,
                s == null ? null : new BankInfo(s.getBankName(), s.getAccountNo(), s.getAccountName()),
                s == null ? null : PaymentSettingsService.qrImageUrl(s, o.getAmount(), o.getTransferContent()),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                receipt,
                rows);
    }

    private static ReceiptResponse receiptResponse(PaymentReceipt r) {
        return new ReceiptResponse(
                r.getReceivedAmount(),
                r.getBankTransactionRef(),
                r.getReceivedAt(),
                r.getConfirmedBy() == null ? null : r.getConfirmedBy().getFullName(),
                r.getConfirmedAt(),
                r.getAdminNote());
    }

    private static String label(Status status) {
        return switch (status) {
            case PENDING -> "Chờ chuyển khoản";
            case AWAITING_CONFIRMATION -> "Chờ xác nhận";
            case PAID -> "Đã thanh toán";
            case REJECTED -> "Bị từ chối";
            case CANCELLED -> "Đã hủy";
            case EXPIRED -> "Hết hạn";
        };
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản học viên"));
    }

    private User admin(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.ADMIN && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản quản trị"));
    }
}
