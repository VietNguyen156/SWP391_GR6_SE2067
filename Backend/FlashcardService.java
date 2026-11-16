package elearning.service;

import elearning.dto.FlashcardDto.FlashcardProgressRequest;
import elearning.dto.FlashcardDto.FlashcardRequest;
import elearning.dto.FlashcardDto.FlashcardResponse;
import elearning.dto.FlashcardDto.FlashcardSetRequest;
import elearning.dto.FlashcardDto.FlashcardSetResponse;
import elearning.dto.FlashcardDto.FlashcardSetSummaryResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.Flashcard;
import elearning.entity.FlashcardProgress;
import elearning.entity.FlashcardSet;
import elearning.entity.Lesson;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.exception.LearningAccessException;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.CourseWeekRepository;
import elearning.repository.FlashcardProgressRepository;
import elearning.repository.FlashcardRepository;
import elearning.repository.FlashcardSetRepository;
import elearning.repository.LessonRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class FlashcardService {
    private final FlashcardSetRepository sets;
    private final FlashcardRepository cards;
    private final FlashcardProgressRepository progress;
    private final UserRepository users;
    private final ProgressService tracking;
    private final CourseWeekRepository weeks;
    private final ClassEnrollmentRepository enrollments;
    private final LessonRepository lessons;
    private final LessonService lessonService;

    public FlashcardService(
            FlashcardSetRepository s,
            FlashcardRepository c,
            FlashcardProgressRepository p,
            UserRepository u,
            ProgressService ps,
            CourseWeekRepository w,
            ClassEnrollmentRepository e,
            LessonRepository l,
            LessonService ls) {
        sets = s;
        cards = c;
        progress = p;
        users = u;
        tracking = ps;
        weeks = w;
        enrollments = e;
        lessons = l;
        lessonService = ls;
    }

    public FlashcardSetResponse createTeacher(String email, FlashcardSetRequest r) {
        User owner = teacher(email);
        return create(owner, r, false);
    }

    public FlashcardSetResponse updateTeacher(String email, Long id, FlashcardSetRequest r) {
        User owner = teacher(email);
        return update(ownedSet(id, owner.getId()), r, false, null);
    }

    public void deleteTeacher(String email, Long id) {
        User owner = teacher(email);
        FlashcardSet set = ownedSet(id, owner.getId());
        // Xóa bộ thẻ sẽ xóa dây chuyền tiến độ ôn của học viên (FK ON DELETE CASCADE).
        if (progress.existsByFlashcardFlashcardSetId(id)) {
            throw new IllegalArgumentException(
                    "Bộ flashcard đã có học viên ôn tập nên không thể xóa. Hãy giữ bộ thẻ để bảo toàn tiến độ của học viên.");
        }
        sets.delete(set);
    }

    public FlashcardSetResponse createPersonal(String email, FlashcardSetRequest r) {
        User owner = student(email);
        return create(owner, r, true);
    }

    public FlashcardSetResponse updatePersonal(String email, Long id, FlashcardSetRequest r) {
        User owner = student(email);
        return update(ownedSet(id, owner.getId()), r, true, owner);
    }

    public void deletePersonal(String email, Long id) {
        User owner = student(email);
        sets.delete(ownedSet(id, owner.getId()));
    }

    @Transactional(readOnly = true)
    public List<FlashcardSetSummaryResponse> teacherSets(String email) {
        User t = teacher(email);
        return sets.findAllByCreatedByUserIdOrderByUpdatedAtDesc(t.getId()).stream()
                .map(this::summary)
                .toList();
    }

    @Transactional(readOnly = true)
    public FlashcardSetResponse teacherSet(String email, Long id) {
        User t = teacher(email);
        return response(ownedSet(id, t.getId()), null);
    }

    @Transactional(readOnly = true)
    public List<FlashcardSetSummaryResponse> studentSets(String email) {
        User s = student(email);
        LinkedHashMap<Long, FlashcardSet> visible = new LinkedHashMap<>();
        sets.findAllByStatusOrderByUpdatedAtDesc(FlashcardSet.Status.PUBLISHED).stream()
                .filter(x -> canStudentAccessSet(s, x))
                .forEach(x -> visible.put(x.getId(), x));
        sets.findAllByCreatedByUserIdOrderByUpdatedAtDesc(s.getId())
                .forEach(x -> visible.put(x.getId(), x));
        return visible.values().stream().map(this::summary).toList();
    }

    @Transactional(readOnly = true)
    public FlashcardSetResponse studentSet(String email, Long id) {
        User s = student(email);
        FlashcardSet set =
                sets.findById(id)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy bộ flashcard"));
        requireSetAccess(s, set);
        return response(set, s);
    }

    public FlashcardResponse updateProgress(String email, Long cardId, FlashcardProgressRequest r) {
        User s = student(email);
        Flashcard card =
                cards.findById(cardId)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy flashcard"));
        requireSetAccess(s, card.getFlashcardSet());
        Optional<FlashcardProgress> existing =
                progress.findByStudentIdAndFlashcardId(s.getId(), cardId);
        FlashcardProgress p =
                existing.orElseGet(
                        () -> {
                            FlashcardProgress n = new FlashcardProgress();
                            n.setStudent(s);
                            n.setFlashcard(card);
                            return n;
                        });
        LocalDateTime now = LocalDateTime.now();
        p.setMemoryStatus(r.memoryStatus());
        p.setReviewCount((p.getReviewCount() == null ? 0 : p.getReviewCount()) + 1);
        p.setLastReviewedAt(now);
        p.setNextReviewAt(
                switch (r.memoryStatus()) {
                    case NEW, LEARNING, REVIEW -> now.plusDays(1);
                    case REMEMBERED -> now.plusDays(7);
                });
        progress.save(p);
        tracking.recordFlashcardReviewed(s, card, existing.isEmpty());
        return cardResponse(card, p);
    }

    private FlashcardSetResponse create(User owner, FlashcardSetRequest r, boolean personal) {
        FlashcardSet set = new FlashcardSet();
        set.setCreatedByUser(owner);
        if (!personal) {
            set.setCourseWeek(weekOwnedByTeacher(r.courseWeekId(), owner.getId()));
            set.setLesson(lessonOwnedByTeacher(r.lessonId(), r.courseWeekId(), owner.getId()));
        }
        applySet(set, r, personal);
        sets.save(set);
        syncCards(set, r.cards());
        return response(set, personal ? owner : null);
    }

    private FlashcardSetResponse update(
            FlashcardSet set, FlashcardSetRequest r, boolean personal, User progressUser) {
        if (!personal) {
            set.setCourseWeek(weekOwnedByTeacher(r.courseWeekId(), set.getCreatedByUser().getId()));
            set.setLesson(
                    lessonOwnedByTeacher(
                            r.lessonId(), r.courseWeekId(), set.getCreatedByUser().getId()));
        }
        applySet(set, r, personal);
        sets.save(set);
        if (r.cards() != null) {
            if (!personal) requireRemovedCardsUnused(set, r.cards());
            syncCards(set, r.cards());
        }
        return response(set, progressUser);
    }

    private void applySet(FlashcardSet s, FlashcardSetRequest r, boolean personal) {
        s.setTitle(r.title().trim());
        s.setDescription(clean(r.description()));
        s.setTopic(clean(r.topic()));
        s.setToeicPart(r.toeicPart() == null ? FlashcardSet.ToeicPart.GENERAL : r.toeicPart());
        s.setDifficulty(r.difficulty() == null ? FlashcardSet.Difficulty.MEDIUM : r.difficulty());
        // Ẩn/hiện chỉ còn ở khóa học và tuần; bài và học liệu luôn hiển thị.
        s.setStatus(FlashcardSet.Status.PUBLISHED);
    }

    /** Không cho bỏ thẻ mà học viên đã ôn (sẽ mất tiến độ); sửa nội dung thẻ vẫn được phép. */
    private void requireRemovedCardsUnused(FlashcardSet set, List<FlashcardRequest> requested) {
        Set<Long> keptIds =
                requested.stream()
                        .map(FlashcardRequest::id)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
        boolean removesStudiedCard =
                cards.findAllByFlashcardSetIdOrderBySortOrderAsc(set.getId()).stream()
                        .filter(card -> !keptIds.contains(card.getId()))
                        .anyMatch(card -> progress.existsByFlashcardId(card.getId()));
        if (removesStudiedCard) {
            throw new IllegalArgumentException(
                    "Không thể xóa thẻ đã có học viên ôn tập. Bạn vẫn có thể sửa nội dung thẻ hoặc thêm thẻ mới.");
        }
    }

    private void syncCards(FlashcardSet set, List<FlashcardRequest> requested) {
        if (requested == null) return;
        List<Flashcard> existing = cards.findAllByFlashcardSetIdOrderBySortOrderAsc(set.getId());
        Map<Long, Flashcard> byId =
                existing.stream().collect(Collectors.toMap(Flashcard::getId, Function.identity()));
        Set<Long> kept = new HashSet<>();
        Set<Integer> orders = new HashSet<>();
        int next = 1;
        // Move persisted rows out of the requested range first. This avoids the
        // (set_id, sort_order) unique key failing when cards are deleted/reordered.
        if (!existing.isEmpty()) {
            int temporaryOrder = 1_000_000;
            for (Flashcard card : existing) card.setSortOrder(temporaryOrder++);
            cards.saveAllAndFlush(existing);
        }
        for (FlashcardRequest r : requested) {
            Flashcard card;
            if (r.id() == null) card = new Flashcard();
            else {
                card = byId.get(r.id());
                if (card == null)
                    throw new IllegalArgumentException("Flashcard không thuộc bộ hiện tại");
                kept.add(card.getId());
            }
            card.setFlashcardSet(set);
            int order;
            if (r.sortOrder() == null) {
                while (orders.contains(next)) next++;
                order = next;
            } else {
                order = r.sortOrder();
                if (orders.contains(order))
                    throw new IllegalArgumentException("Thứ tự flashcard bị trùng");
            }
            orders.add(order);
            next = Math.max(next, order + 1);
            card.setFrontText(r.frontText().trim());
            card.setBackText(r.backText().trim());
            card.setPronunciation(clean(r.pronunciation()));
            card.setWordType(clean(r.wordType()));
            card.setExampleSentence(clean(r.exampleSentence()));
            card.setImageUrl(clean(r.imageUrl()));
            card.setAudioUrl(clean(r.audioUrl()));
            card.setSortOrder(order);
            cards.save(card);
        }
        List<Flashcard> removed = existing.stream().filter(c -> !kept.contains(c.getId())).toList();
        if (!removed.isEmpty()) cards.deleteAll(removed);
    }

    private FlashcardSetSummaryResponse summary(FlashcardSet s) {
        return new FlashcardSetSummaryResponse(
                s.getId(),
                s.getCourseWeek() == null ? null : s.getCourseWeek().getId(),
                s.getLesson() == null ? null : s.getLesson().getId(),
                s.getTitle(),
                s.getDescription(),
                s.getTopic(),
                s.getToeicPart().name(),
                s.getDifficulty().name(),
                s.getStatus().name(),
                cards.countByFlashcardSetId(s.getId()),
                s.getCreatedByUser().getRole() == UserRole.STUDENT,
                s.getUpdatedAt(),
                inUse(s));
    }

    /** Bộ thẻ của giáo viên đã có học viên ôn tập (bộ cá nhân luôn xóa được). */
    private boolean inUse(FlashcardSet s) {
        return s.getId() != null
                && s.getCreatedByUser().getRole() == UserRole.TEACHER
                && progress.existsByFlashcardFlashcardSetId(s.getId());
    }

    private FlashcardSetResponse response(FlashcardSet s, User progressUser) {
        Map<Long, FlashcardProgress> map =
                progressUser == null
                        ? Map.of()
                        : progress
                                .findAllByStudentIdAndFlashcardFlashcardSetId(
                                        progressUser.getId(), s.getId())
                                .stream()
                                .collect(
                                        Collectors.toMap(
                                                x -> x.getFlashcard().getId(),
                                                Function.identity()));
        return new FlashcardSetResponse(
                s.getId(),
                s.getCreatedByUser().getId(),
                s.getCourseWeek() == null ? null : s.getCourseWeek().getId(),
                s.getLesson() == null ? null : s.getLesson().getId(),
                s.getCreatedByUser().getFullName(),
                s.getCreatedByUser().getRole() == UserRole.STUDENT,
                s.getTitle(),
                s.getDescription(),
                s.getTopic(),
                s.getToeicPart().name(),
                s.getDifficulty().name(),
                s.getStatus().name(),
                cards.findAllByFlashcardSetIdOrderBySortOrderAsc(s.getId()).stream()
                        .map(c -> cardResponse(c, map.get(c.getId())))
                        .toList(),
                s.getCreatedAt(),
                s.getUpdatedAt(),
                inUse(s));
    }

    private FlashcardResponse cardResponse(Flashcard c, FlashcardProgress p) {
        return new FlashcardResponse(
                c.getId(),
                c.getFrontText(),
                c.getBackText(),
                c.getPronunciation(),
                c.getWordType(),
                c.getExampleSentence(),
                c.getImageUrl(),
                c.getAudioUrl(),
                c.getSortOrder(),
                p == null ? FlashcardProgress.MemoryStatus.NEW.name() : p.getMemoryStatus().name(),
                p == null ? 0 : p.getReviewCount(),
                p == null ? null : p.getLastReviewedAt(),
                p == null ? null : p.getNextReviewAt());
    }

    private boolean canStudentAccessSet(User student, FlashcardSet set) {
        try {
            requireSetAccess(student, set);
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    /** Ném lỗi kèm lý do thật: 404 khi nháp/không tồn tại, 403 khi chưa ghi danh hoặc bài bị khóa. */
    private void requireSetAccess(User student, FlashcardSet set) {
        if (set.getCreatedByUser().getId().equals(student.getId())) return;
        if (set.getCreatedByUser().getRole() != UserRole.TEACHER
                || set.getStatus() != FlashcardSet.Status.PUBLISHED
                || set.getCourseWeek() == null
                || set.getCourseWeek().getStatus() != elearning.entity.CourseWeek.Status.PUBLISHED
                || set.getCourseWeek().getCourse().getStatus()
                        != elearning.entity.Course.Status.PUBLISHED) {
            throw new ContentNotFoundException("Không tìm thấy bộ flashcard");
        }
        if (set.getLesson() != null) {
            lessonService.requireStudentAccess(student, set.getLesson());
            return;
        }
        Long courseId = set.getCourseWeek().getCourse().getId();
        if (!enrollments.existsByStudentIdAndClassroomCourseIdAndStatus(
                student.getId(), courseId, ClassEnrollment.Status.ACTIVE)) {
            throw LearningAccessException.notEnrolled(
                    "Bạn cần tham gia một lớp của khóa học trước khi học bộ flashcard này", courseId);
        }
    }

    private FlashcardSet ownedSet(Long id, Long ownerId) {
        return sets.findByIdAndCreatedByUserId(id, ownerId)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy bộ flashcard"));
    }

    private User teacher(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.TEACHER && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy giáo viên"));
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));
    }

    private elearning.entity.CourseWeek weekOwnedByTeacher(Long id, Long teacherId) {
        if (id == null) throw new IllegalArgumentException("Vui lòng chọn tuần học");
        return weeks.findById(id)
                .filter(w -> w.getCourse().getCreatedByTeacher().getId().equals(teacherId))
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Tuần học không thuộc khóa học của giáo viên"));
    }

    private Lesson lessonOwnedByTeacher(Long lessonId, Long weekId, Long teacherId) {
        if (lessonId == null) {
            throw new IllegalArgumentException("Vui lòng chọn bài học trước khi tạo học liệu");
        }
        Lesson lesson =
                lessons.findByIdAndCreatedByTeacherId(lessonId, teacherId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        if (lesson.getCourseWeek() == null || !lesson.getCourseWeek().getId().equals(weekId)) {
            throw new IllegalArgumentException("Bài học không thuộc tuần đã chọn");
        }
        return lesson;
    }

    private String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
