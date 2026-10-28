package elearning.service;

import elearning.dto.ProgressDto.TeacherCourseStatisticResponse;
import elearning.dto.ProgressDto.TeacherDashboardResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.ClassRoom;
import elearning.entity.Course;
import elearning.entity.StudentLearningProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.ClassRoomRepository;
import elearning.repository.CourseRepository;
import elearning.repository.StudentLearningProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private final CourseRepository courses;
    private final StudentLearningProgressRepository progress;
    private final JdbcTemplate db;
    private final UserRepository users;
    private final ClassRoomRepository classes;
    private final ClassEnrollmentRepository enrollments;

    public DashboardService(
            CourseRepository c,
            StudentLearningProgressRepository p,
            JdbcTemplate db,
            UserRepository u,
            ClassRoomRepository cr,
            ClassEnrollmentRepository e) {
        courses = c;
        progress = p;
        this.db = db;
        users = u;
        classes = cr;
        enrollments = e;
    }

    public TeacherDashboardResponse teacherDashboard(String email) {
        User user = contentUser(email);
        List<Course> owned =
                user.getRole() == UserRole.ADMIN
                        ? courses.findAll()
                        : courses.findAllByCreatedByTeacherIdOrderByUpdatedAtDesc(user.getId());
        List<TeacherCourseStatisticResponse> rows = new ArrayList<>();
        Set<Long> allStudents = new HashSet<>();
        List<BigDecimal> allProgress = new ArrayList<>();
        List<BigDecimal> allScores = new ArrayList<>();
        int totalClasses = 0;
        for (Course course : owned) {
            List<ClassRoom> courseClasses = classes.findAllByCourseId(course.getId());
            totalClasses += courseClasses.size();
            Set<Long> studentIds =
                    enrollments
                            .findAllByClassroomCourseIdAndStatus(
                                    course.getId(), ClassEnrollment.Status.ACTIVE)
                            .stream()
                            .map(x -> x.getStudent().getId())
                            .collect(Collectors.toSet());
            List<StudentLearningProgress> cp =
                    progress.findAllByCourseId(course.getId()).stream()
                            .filter(x -> studentIds.contains(x.getStudent().getId()))
                            .toList();
            allStudents.addAll(studentIds);
            List<BigDecimal> scores = db.queryForList("SELECT a.student_id,100.0*a.earned_points/NULLIF(a.total_points,0) AS earned_points FROM test_attempts a JOIN course_tests t ON t.id=a.test_id WHERE t.course_id=? AND a.status='GRADED'", course.getId()).stream()
                    .filter(row -> studentIds.contains(((Number) row.get("student_id")).longValue()))
                    .map(row -> (BigDecimal) row.get("earned_points")).filter(Objects::nonNull).toList();
            List<BigDecimal> percentages =
                    cp.stream().map(StudentLearningProgress::getProgressPercentage).toList();
            allProgress.addAll(percentages);
            allScores.addAll(scores);
            int completed =
                    cp.stream().mapToInt(StudentLearningProgress::getCompletedLessons).sum();
            BigDecimal completion = average(percentages);
            rows.add(
                    new TeacherCourseStatisticResponse(
                            course.getId(),
                            course.getTitle(),
                            courseClasses.size(),
                            studentIds.size(),
                            average(percentages),
                            completion,
                            average(scores),
                            completed));
        }
        return new TeacherDashboardResponse(
                owned.size(),
                totalClasses,
                allStudents.size(),
                average(allProgress),
                average(allProgress),
                average(allScores),
                rows);
    }

    private BigDecimal average(List<BigDecimal> values) {
        return values.isEmpty()
                ? BigDecimal.ZERO
                : values.stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private User contentUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(
                        x ->
                                x.getStatus() == UserStatus.ACTIVE
                                        && (x.getRole() == UserRole.TEACHER
                                                || x.getRole() == UserRole.ADMIN))
                .orElseThrow(
                        () ->
                                new ContentNotFoundException(
                                        "Không tìm thấy người quản lý nội dung"));
    }
}
