package elearning.controller;

import elearning.entity.ClassEnrollment;
import elearning.entity.ListeningActivity;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.UserRepository;
import elearning.service.MediaStorageService;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/media")
@PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
public class MediaController {
    private final MediaStorageService media;
    private final UserRepository users;
    private final ListeningActivityRepository activities;
    private final ClassEnrollmentRepository enrollments;

    public MediaController(
            MediaStorageService media,
            UserRepository users,
            ListeningActivityRepository activities,
            ClassEnrollmentRepository enrollments) {
        this.media = media;
        this.users = users;
        this.activities = activities;
        this.enrollments = enrollments;
    }

    @GetMapping("/listening")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> listening(Principal principal, @RequestParam String url) {
        User user =
                users.findByEmailIgnoreCase(principal.getName())
                        .filter(viewer -> viewer.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new AccessDeniedException("Tài khoản không hoạt động"));
        if (!url.startsWith("/uploads/listening/") || url.contains("..")) {
            throw new IllegalArgumentException("Đường dẫn bài nghe không hợp lệ");
        }

        // A teacher can preview their own new upload before attaching it to a lesson.
        boolean ownUpload =
                user.getRole() == UserRole.TEACHER
                        && url.startsWith("/uploads/listening/" + user.getId() + "/");
        boolean allowed =
                user.getRole() == UserRole.ADMIN
                        || ownUpload
                        || activities.findAllByAudioUrl(url).stream()
                                .anyMatch(activity -> canRead(user, activity));
        if (!allowed) {
            throw new AccessDeniedException("Bạn không có quyền nghe file này");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.contentType(url)))
                .header("Cache-Control", "private, no-store")
                .body(media.load(url));
    }

    private boolean canRead(User user, ListeningActivity activity) {
        if (user.getRole() == UserRole.TEACHER) {
            return activity.getTeacher().getId().equals(user.getId());
        }
        return user.getRole() == UserRole.STUDENT
                && activity.getStatus() == ListeningActivity.Status.PUBLISHED
                && enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                        user.getId(),
                        activity.getCourseWeek().getCourse().getId(),
                        ClassEnrollment.Status.ACTIVE);
    }
}
