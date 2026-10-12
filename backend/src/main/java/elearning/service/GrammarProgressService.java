package elearning.service;

import elearning.dto.GrammarDto.GrammarProgressResponse;
import elearning.entity.GrammarTopic;
import elearning.entity.StudentGrammarProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.StudentGrammarProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@Transactional
public class GrammarProgressService {
    private final GrammarTopicRepository topics;
    private final StudentGrammarProgressRepository progress;
    private final UserRepository users;
    private final ProgressService tracking;
    private final GrammarService grammarService;

    public GrammarProgressService(
            GrammarTopicRepository t,
            StudentGrammarProgressRepository p,
            UserRepository u,
            ProgressService ps,
            GrammarService grammarService) {
        topics = t;
        progress = p;
        users = u;
        tracking = ps;
        this.grammarService = grammarService;
    }

    public GrammarProgressResponse complete(String email, Long id) {
        User student =
                users.findByEmailIgnoreCase(email)
                        .filter(
                                u ->
                                        u.getRole() == UserRole.STUDENT
                                                && u.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));
        // Reuse the same enrollment / lesson-unlock checks as the read endpoint.
        grammarService.studentTopic(email, id);
        GrammarTopic topic =
                topics.findByIdAndStatus(id, GrammarTopic.Status.PUBLISHED)
                        .orElseThrow(
                                () ->
                                        new ContentNotFoundException(
                                                "Không tìm thấy chủ đề ngữ pháp"));
        StudentGrammarProgress p =
                progress.findByStudentIdAndGrammarTopicId(student.getId(), id)
                        .orElseGet(
                                () -> {
                                    StudentGrammarProgress n = new StudentGrammarProgress();
                                    n.setStudent(student);
                                    n.setGrammarTopic(topic);
                                    return n;
                                });
        boolean firstCompletion = p.getStatus() != StudentGrammarProgress.Status.COMPLETED;
        p.setStatus(StudentGrammarProgress.Status.COMPLETED);
        p.setProgressPercent(new BigDecimal("100.00"));
        p.setLastAccessedAt(LocalDateTime.now());
        progress.save(p);
        tracking.recordGrammarCompleted(student, topic, firstCompletion);
        return new GrammarProgressResponse(
                id, p.getStatus().name(), p.getProgressPercent(), p.getLastAccessedAt());
    }
}
