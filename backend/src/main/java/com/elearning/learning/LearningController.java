package com.elearning.learning;

import java.security.Principal;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import static com.elearning.learning.LearningRequests.*;
import static com.elearning.learning.LearningService.*;

@RestController
@RequestMapping("/api")
public class LearningController {
    private final LearningService service;
    public LearningController(LearningService service) { this.service=service; }
    @GetMapping("/packages") public List<PackageView> catalog() { return service.catalog(); }
    @GetMapping("/mentor/packages") public List<PackageView> packages(Principal p) { return service.mentorPackages(p.getName()); }
    @PostMapping("/mentor/packages") @ResponseStatus(HttpStatus.CREATED)
    public PackageView createPackage(Principal p, @Valid @RequestBody PackageRequest r) { return service.createPackage(p.getName(),r); }
    @GetMapping("/mentor/classes") public List<ClassView> classes(Principal p) { return service.mentorClasses(p.getName()); }
    @PostMapping("/mentor/classes") @ResponseStatus(HttpStatus.CREATED)
    public ClassView createClass(Principal p, @Valid @RequestBody ClassRequest r) { return service.createClass(p.getName(),r); }
    @GetMapping("/mentor/classes/{id}/students")
    public List<StudentView> students(Principal p, @PathVariable Long id) { return service.students(p.getName(),id); }
    @PostMapping("/mentor/classes/{id}/students") @ResponseStatus(HttpStatus.CREATED)
    public StudentView addStudent(Principal p, @PathVariable Long id, @Valid @RequestBody AddStudentRequest r) { return service.addStudent(p.getName(),id,r); }
    @GetMapping("/student/classes") public List<ClassView> myClasses(Principal p) { return service.myClasses(p.getName()); }
    @GetMapping("/student/subscriptions") public List<PurchaseView> purchases(Principal p) { return service.myPurchases(p.getName()); }
    @PostMapping("/student/packages/{id}/purchase") @ResponseStatus(HttpStatus.CREATED)
    public PurchaseView purchase(Principal p, @PathVariable Long id) { return service.purchase(p.getName(),id); }
    @GetMapping("/admin/payments") public List<PaymentView> payments(Principal p) { return service.pendingPayments(p.getName()); }
    @PostMapping("/admin/payments/{id}/confirm")
    public PaymentView confirm(Principal p, @PathVariable Long id) { return service.confirmPayment(p.getName(),id); }
}
