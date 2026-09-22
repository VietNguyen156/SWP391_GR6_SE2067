package com.elearning.learning;

import com.elearning.user.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.server.ResponseStatusException;
import static com.elearning.learning.LearningRequests.*;

@Service
@Transactional(readOnly=true)
public class LearningService {
    private final UserRepository users;
    private final TuitionPackageRepository packages;
    private final CourseRepository courses;
    private final StudyClassRepository classes;
    private final EnrollmentRepository enrollments;
    private final SubscriptionRepository subscriptions;
    private final PaymentRepository payments;

    public LearningService(UserRepository users, TuitionPackageRepository packages, CourseRepository courses,
            StudyClassRepository classes, EnrollmentRepository enrollments,
            SubscriptionRepository subscriptions, PaymentRepository payments) {
        this.users=users; this.packages=packages; this.courses=courses; this.classes=classes;
        this.enrollments=enrollments; this.subscriptions=subscriptions; this.payments=payments;
    }
    private User actor(String email, UserRole role) {
        User user=users.findByEmailIgnoreCase(email).orElseThrow(()->error(HttpStatus.UNAUTHORIZED,"Vui lòng đăng nhập"));
        if (user.getRole()!=role || user.getStatus()!=UserStatus.ACTIVE)
            throw error(HttpStatus.FORBIDDEN,"Bạn không có quyền thực hiện thao tác này");
        return user;
    }
    private static ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status,message);
    }
    private void owner(StudyClass c, User mentor) {
        if (!c.getMentor().getId().equals(mentor.getId()))
            throw error(HttpStatus.FORBIDDEN,"Bạn chỉ được quản lý lớp của mình");
    }
    public record PackageView(Long id, String name, String description, BigDecimal price,
            Integer durationDays, String status, String mentorName) {}
    public record ClassView(Long id, String name, String classCode, String description, LocalDate startDate,
            LocalDate endDate, Integer maxStudents, long studentCount, String status, String mentorName) {}
    public record StudentView(Long id, String fullName, String email, String status) {}
    public record PurchaseView(Long id, Long packageId, String packageName, BigDecimal amount,
            String status, LocalDateTime createdAt, LocalDateTime startAt, LocalDateTime endAt) {}
    public record PaymentView(Long id, String studentName, String studentEmail, String packageName,
            BigDecimal amount, String status, LocalDateTime createdAt) {}
    private PackageView packageView(TuitionPackage p) {
        return new PackageView(p.getId(),p.getName(),p.getDescription(),p.getPrice(),p.getDurationDays(),p.getStatus(),p.getMentor().getFullName());
    }
    private ClassView classView(StudyClass c) {
        return new ClassView(c.getId(),c.getName(),c.getClassCode(),c.getDescription(),c.getStartDate(),c.getEndDate(),
            c.getMaxStudents(),enrollments.countByStudyClassIdAndStatus(c.getId(),"ACTIVE"),c.getStatus(),c.getMentor().getFullName());
    }
    private PurchaseView purchaseView(Subscription s) {
        BigDecimal amount=payments.findBySubscriptionId(s.getId()).map(Payment::getAmount).orElse(s.getTuitionPackage().getPrice());
        return new PurchaseView(s.getId(),s.getTuitionPackage().getId(),s.getTuitionPackage().getName(),amount,
            s.getStatus(),s.getCreatedAt(),s.getStartAt(),s.getEndAt());
    }
    private PaymentView paymentView(Payment p) {
        return new PaymentView(p.getId(),p.getStudent().getFullName(),p.getStudent().getEmail(),
            p.getSubscription().getTuitionPackage().getName(),p.getAmount(),p.getStatus(),p.getCreatedAt());
    }
    public List<PackageView> catalog() { return packages.findByStatusOrderByCreatedAtDesc("ACTIVE").stream().map(this::packageView).toList(); }
    public List<PackageView> mentorPackages(String email) {
        return packages.findByMentorIdOrderByCreatedAtDesc(actor(email,UserRole.TEACHER).getId()).stream().map(this::packageView).toList();
    }
    @Transactional public PackageView createPackage(String email, PackageRequest r) {
        User mentor=actor(email,UserRole.TEACHER);
        TuitionPackage p=new TuitionPackage(); p.setMentor(mentor); p.setName(r.name().trim());
        p.setDescription(r.description()); p.setPrice(r.price()); p.setDurationDays(r.durationDays());
        return packageView(packages.save(p));
    }
    public List<ClassView> mentorClasses(String email) {
        return classes.findByMentorIdOrderByCreatedAtDesc(actor(email,UserRole.TEACHER).getId()).stream().map(this::classView).toList();
    }
    @Transactional public ClassView createClass(String email, ClassRequest r) {
        User mentor=actor(email,UserRole.TEACHER);
        if (r.startDate()!=null && r.endDate()!=null && r.endDate().isBefore(r.startDate()))
            throw error(HttpStatus.BAD_REQUEST,"Ngày kết thúc phải từ ngày bắt đầu trở đi");
        // Each standalone class starts with an empty course, as required by the existing schema.
        Course course=new Course(); course.setMentor(mentor); course.setTitle(r.name().trim());
        course.setSlug("class-"+UUID.randomUUID()); courses.save(course);
        StudyClass c=new StudyClass(); c.setCourse(course); c.setCreator(mentor); c.setMentor(mentor);
        c.setName(r.name().trim()); c.setDescription(r.description()); c.setClassCode("CLS-"+UUID.randomUUID());
        c.setStartDate(r.startDate()); c.setEndDate(r.endDate()); c.setMaxStudents(r.maxStudents());
        return classView(classes.save(c));
    }
    public List<StudentView> students(String email, Long classId) {
        User mentor=actor(email,UserRole.TEACHER);
        StudyClass c=classes.findById(classId).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Không tìm thấy lớp"));
        owner(c,mentor);
        return enrollments.findByStudyClassIdOrderByEnrolledAtDesc(classId).stream()
            .map(e->new StudentView(e.getStudent().getId(),e.getStudent().getFullName(),e.getStudent().getEmail(),e.getStatus())).toList();
    }
    @Transactional(isolation=Isolation.READ_COMMITTED) public StudentView addStudent(String email, Long classId, AddStudentRequest r) {
        User mentor=actor(email,UserRole.TEACHER);
        StudyClass c=classes.lockById(classId).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Không tìm thấy lớp"));
        owner(c,mentor);
        if (!List.of("OPEN","ONGOING").contains(c.getStatus()) || (c.getEndDate()!=null && c.getEndDate().isBefore(LocalDate.now())))
            throw error(HttpStatus.CONFLICT,"Lớp không còn nhận học viên");
        User student=users.findByEmailIgnoreCase(r.email().trim()).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Không tìm thấy học viên với email này"));
        if (student.getRole()!=UserRole.STUDENT || student.getStatus()!=UserStatus.ACTIVE)
            throw error(HttpStatus.BAD_REQUEST,"Chỉ thêm được tài khoản học viên đang hoạt động");
        if (enrollments.existsByStudyClassIdAndStudentId(classId,student.getId()))
            throw error(HttpStatus.CONFLICT,"Học viên đã có trong lớp");
        if (c.getMaxStudents()!=null && enrollments.countByStudyClassIdAndStatus(classId,"ACTIVE")>=c.getMaxStudents())
            throw error(HttpStatus.CONFLICT,"Lớp đã đủ số lượng học viên");
        Enrollment e=new Enrollment(); e.setStudyClass(c); e.setStudent(student); enrollments.save(e);
        return new StudentView(student.getId(),student.getFullName(),student.getEmail(),e.getStatus());
    }
    public List<ClassView> myClasses(String email) {
        return enrollments.findByStudentIdAndStatusOrderByEnrolledAtDesc(actor(email,UserRole.STUDENT).getId(),"ACTIVE")
            .stream().map(e->classView(e.getStudyClass())).toList();
    }
    @Transactional(isolation=Isolation.READ_COMMITTED) public PurchaseView purchase(String email, Long packageId) {
        User student=actor(email,UserRole.STUDENT);
        TuitionPackage p=packages.lockById(packageId).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Không tìm thấy gói học phí"));
        if (!"ACTIVE".equals(p.getStatus())) throw error(HttpStatus.CONFLICT,"Gói học phí hiện không mở đăng ký");
        if (subscriptions.hasCurrentSubscription(student.getId(),packageId,LocalDateTime.now()))
            throw error(HttpStatus.CONFLICT,"Bạn đã đăng ký gói này và đang chờ xác nhận hoặc còn thời hạn sử dụng");
        Subscription s=new Subscription(); s.setStudent(student); s.setTuitionPackage(p); subscriptions.save(s);
        Payment payment=new Payment(); payment.setStudent(student); payment.setSubscription(s); payment.setAmount(p.getPrice()); payments.save(payment);
        return purchaseView(s);
    }
    public List<PurchaseView> myPurchases(String email) {
        return subscriptions.findByStudentIdOrderByCreatedAtDesc(actor(email,UserRole.STUDENT).getId()).stream().map(this::purchaseView).toList();
    }
    public List<PaymentView> pendingPayments(String email) {
        actor(email,UserRole.ADMIN);
        return payments.findByStatusOrderByCreatedAtDesc("PENDING").stream().map(this::paymentView).toList();
    }
    @Transactional public PaymentView confirmPayment(String email, Long id) {
        User admin=actor(email,UserRole.ADMIN);
        Payment p=payments.lockById(id).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Không tìm thấy yêu cầu thanh toán"));
        if (!"PENDING".equals(p.getStatus()) || !"PENDING".equals(p.getSubscription().getStatus()))
            throw error(HttpStatus.CONFLICT,"Yêu cầu này đã được xử lý");
        LocalDateTime now=LocalDateTime.now();
        p.setStatus("PAID"); p.setPaidAt(now); p.setConfirmedAt(now); p.setConfirmedBy(admin);
        Subscription s=p.getSubscription(); s.setStatus("ACTIVE"); s.setStartAt(now); s.setActivatedAt(now);
        Integer days=s.getTuitionPackage().getDurationDays();
        s.setEndAt(days==null?null:now.plusDays(days));
        return paymentView(p);
    }
}
