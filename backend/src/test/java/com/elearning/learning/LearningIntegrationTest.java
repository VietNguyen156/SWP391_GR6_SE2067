package com.elearning.learning;

import com.elearning.security.JwtService;
import com.elearning.user.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:learning;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@Transactional
class LearningIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired PaymentRepository payments;
    @Autowired SubscriptionRepository subscriptions;
    @Autowired StudyClassRepository classes;
    private User mentor, otherMentor, student, admin;

    @BeforeEach void setup() {
        mentor=user("mentor",UserRole.TEACHER);
        otherMentor=user("other",UserRole.TEACHER);
        student=user("student",UserRole.STUDENT);
        admin=user("admin",UserRole.ADMIN);
    }
    private User user(String name, UserRole role) {
        User u=new User(); u.setEmail(name+"@example.com"); u.setFullName(name);
        u.setPasswordHash("unused"); u.setRole(role); return users.save(u);
    }
    private String token(User user) { return "Bearer "+jwt.generate(user); }
    private ResultActions postAs(User user, String path, Object body) throws Exception {
        return mvc.perform(post(path).header("Authorization",token(user)).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(body)));
    }
    private ResultActions getAs(User user, String path) throws Exception {
        return mvc.perform(get(path).header("Authorization",token(user)));
    }
    private long id(ResultActions result) throws Exception {
        return json.readTree(result.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asLong();
    }
    private long createPackage() throws Exception {
        return id(postAs(mentor,"/api/mentor/packages",Map.of("name","TOEIC 650","price",1200000,"durationDays",30)));
    }
    private long createClass(int capacity) throws Exception {
        return id(postAs(mentor,"/api/mentor/classes",Map.of("name","Lớp tối","maxStudents",capacity)));
    }
    @Test void purchaseAndPaymentActivation() throws Exception {
        long packageId=createPackage();
        mvc.perform(get("/api/packages")).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("TOEIC 650"));
        long subscriptionId=id(postAs(student,"/api/student/packages/"+packageId+"/purchase",Map.of()));
        getAs(student,"/api/student/subscriptions").andExpect(jsonPath("$[0].status").value("PENDING"))
            .andExpect(jsonPath("$[0].amount").value(1200000));
        Payment payment=payments.findBySubscriptionId(subscriptionId).orElseThrow();
        postAs(mentor,"/api/admin/payments/"+payment.getId()+"/confirm",Map.of()).andExpect(status().isForbidden());
        postAs(admin,"/api/admin/payments/"+payment.getId()+"/confirm",Map.of()).andExpect(status().isOk());
        Subscription subscription=subscriptions.findById(subscriptionId).orElseThrow();
        assertEquals("ACTIVE",subscription.getStatus());
        assertEquals(subscription.getStartAt().plusDays(30),subscription.getEndAt());
        assertEquals(admin.getId(),payment.getConfirmedBy().getId());
        postAs(admin,"/api/admin/payments/"+payment.getId()+"/confirm",Map.of()).andExpect(status().isConflict());
        postAs(student,"/api/student/packages/"+packageId+"/purchase",Map.of()).andExpect(status().isConflict());
    }
    @Test void duplicatePendingPurchaseIsRejected() throws Exception {
        long packageId=createPackage();
        postAs(student,"/api/student/packages/"+packageId+"/purchase",Map.of()).andExpect(status().isCreated());
        postAs(student,"/api/student/packages/"+packageId+"/purchase",Map.of()).andExpect(status().isConflict());
        assertEquals(1,subscriptions.count());
        assertEquals(1,payments.count());
    }
    @Test void mentorAddsStudentAndStudentSeesClass() throws Exception {
        long classId=createClass(2);
        assertNotNull(classes.findById(classId).orElseThrow().getCourse().getId());
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email","STUDENT@example.com")).andExpect(status().isCreated());
        getAs(mentor,"/api/mentor/classes/"+classId+"/students").andExpect(jsonPath("$[0].email").value(student.getEmail()))
            .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
        getAs(student,"/api/student/classes").andExpect(jsonPath("$[0].id").value(classId)).andExpect(jsonPath("$[0].studentCount").value(1));
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email",student.getEmail())).andExpect(status().isConflict());
    }
    @Test void classCapacityIsEnforced() throws Exception {
        long classId=createClass(1);
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email",student.getEmail())).andExpect(status().isCreated());
        User second=user("second",UserRole.STUDENT);
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email",second.getEmail())).andExpect(status().isConflict());
    }
    @Test void mentorCannotAccessAnotherMentorsClass() throws Exception {
        long classId=createClass(2);
        postAs(otherMentor,"/api/mentor/classes/"+classId+"/students",Map.of("email",student.getEmail())).andExpect(status().isForbidden());
        getAs(otherMentor,"/api/mentor/classes/"+classId+"/students").andExpect(status().isForbidden());
        getAs(otherMentor,"/api/mentor/classes").andExpect(jsonPath("$.length()").value(0));
        createPackage();
        getAs(otherMentor,"/api/mentor/packages").andExpect(jsonPath("$.length()").value(0));
    }
    @Test void invalidInputsAreRejected() throws Exception {
        postAs(mentor,"/api/mentor/packages",Map.of("name"," ","price",-1,"durationDays",0)).andExpect(status().isBadRequest());
        postAs(mentor,"/api/mentor/classes",Map.of("name","Class","maxStudents",0)).andExpect(status().isBadRequest());
        postAs(mentor,"/api/mentor/classes",Map.of("name","Class","maxStudents",2,"startDate","2027-02-02","endDate","2027-01-01"))
            .andExpect(status().isBadRequest());
        long classId=createClass(2);
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email","invalid")).andExpect(status().isBadRequest());
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email",admin.getEmail())).andExpect(status().isBadRequest());
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email","missing@example.com")).andExpect(status().isNotFound());
    }
    @Test void roleBoundariesAreEnforced() throws Exception {
        postAs(student,"/api/mentor/packages",Map.of("name","Package","price",0,"durationDays",30)).andExpect(status().isForbidden());
        postAs(admin,"/api/mentor/classes",Map.of("name","Class","maxStudents",2)).andExpect(status().isForbidden());
        getAs(mentor,"/api/student/classes").andExpect(status().isForbidden());
        mvc.perform(get("/api/mentor/classes")).andExpect(status().is4xxClientError());
        getAs(student,"/api/admin/payments").andExpect(status().isForbidden());
    }
    @Test void studentOnlySeesOwnPurchasesAndClasses() throws Exception {
        long packageId=createPackage();
        postAs(student,"/api/student/packages/"+packageId+"/purchase",Map.of()).andExpect(status().isCreated());
        User second=user("second",UserRole.STUDENT);
        getAs(second,"/api/student/subscriptions").andExpect(jsonPath("$.length()").value(0));
        long classId=createClass(2);
        postAs(mentor,"/api/mentor/classes/"+classId+"/students",Map.of("email",student.getEmail())).andExpect(status().isCreated());
        getAs(second,"/api/student/classes").andExpect(jsonPath("$.length()").value(0));
    }
}
