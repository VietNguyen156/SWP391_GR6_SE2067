package elearning.service;

import elearning.dto.ReviewDto.ReviewItem;
import elearning.dto.ReviewDto.ReviewResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.FlashcardProgress;
import elearning.entity.FlashcardSet;
import elearning.entity.GrammarTopic;
import elearning.entity.Lesson;
import elearning.entity.StudentGrammarProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ContentNotFoundException;
import elearning.exception.LearningAccessException;
import elearning.exception.ResourceNotFoundException;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.FlashcardProgressRepository;
import elearning.repository.FlashcardRepository;
import elearning.repository.FlashcardSetRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.LessonRepository;
import elearning.repository.StudentGrammarProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Trang Ôn tập của học viên: bộ flashcard cá nhân + Ngữ pháp, Flashcards và Reading "đã mở".
 *
 * <p>"Đã mở" = học liệu đang Hiển thị, thuộc bài mà học viên mở được theo đúng luật hiện hành
 * ({@link LessonService#requireStudentAccess}: bài/tuần/khóa đang hiển thị, đang ghi danh ACTIVE,
 * không bị khóa tuần tự). Mục không thỏa thì bị lọc bỏ, không ném lỗi.
 */
@Service
@Transactional(readOnly = true)
public class ReviewService {
    private final UserRepository users;
    private final ClassEnrollmentRepository enrollments;
    private final LessonRepository lessons;
    private final LessonService lessonService;
    private final GrammarTopicRepository grammar;
    private final StudentGrammarProgressRepository grammarProgress;
    private final FlashcardSetRepository sets;
    private final FlashcardRepository cards;
    private final FlashcardProgressRepository cardProgress;
    private final elearning.repository.ReadingActivityRepository reading;
    private final elearning.repository.ReadingAttemptRepository readingAttempts;

    public ReviewService(
            UserRepository users,
            ClassEnrollmentRepository enrollments,
            LessonRepository lessons,
            LessonService lessonService,
            GrammarTopicRepository grammar,
            StudentGrammarProgressRepository grammarProgress,
            FlashcardSetRepository sets,
            FlashcardRepository cards,
            FlashcardProgressRepository cardProgress,
            elearning.repository.ReadingActivityRepository reading,
            elearning.repository.ReadingAttemptRepository readingAttempts) {
        this.users = users;
        this.enrollments = enrollments;
        this.lessons = lessons;
        this.lessonService = lessonService;
        this.grammar = grammar;
        this.grammarProgress = grammarProgress;
        this.sets = sets;
        this.cards = cards;
        this.cardProgress = cardProgress;
        this.reading = reading;
        this.readingAttempts = readingAttempts;
    }

    public ReviewResponse review(String email) {
        User student =
                users.findByEmailIgnoreCase(email)
                        .filter(u -> u.getRole() == UserRole.STUDENT && u.getStatus() == UserStatus.ACTIVE)
                        .orElseThrow(() -> new ContentNotFoundException("Không tìm thấy học viên"));

        List<ReviewItem> personal =
                sets.findAllByCreatedByUserIdOrderByUpdatedAtDesc(student.getId()).stream()
                        .map(set -> flashcardItem(set, null, student))
                        .toList();

        List<ReviewItem> grammarItems = new ArrayList<>();
        List<ReviewItem> flashcardItems = new ArrayList<>();
        List<ReviewItem> readingItems = new ArrayList<>();
        List<Long> courseIds =
                enrollments
                        .findAllByStudentIdAndStatusOrderByJoinedAtDesc(
                                student.getId(), ClassEnrollment.Status.ACTIVE)
                        .stream()
                        .map(e -> e.getClassroom().getCourse().getId())
                        .distinct()
                        .toList();
        for (Long courseId : courseIds) {
            for (Lesson lesson :
                    lessons.findAllByCourseWeekCourseIdOrderByCourseWeekWeekNumberAscSortOrderAsc(
                            courseId)) {
                if (!canOpen(student, lesson)) continue;
                grammar.findAllByLessonIdOrderByCreatedAtAsc(lesson.getId()).stream()
                        .filter(topic -> topic.getStatus() == GrammarTopic.Status.PUBLISHED)
                        .forEach(topic -> grammarItems.add(grammarItem(topic, lesson, student)));
                sets.findAllByLessonIdOrderByCreatedAtAsc(lesson.getId()).stream()
                        .filter(set -> set.getStatus() == FlashcardSet.Status.PUBLISHED)
                        .forEach(set -> flashcardItems.add(flashcardItem(set, lesson, student)));
                reading.findAllByLessonIdOrderByCreatedAtAsc(lesson.getId()).stream()
                        .filter(r -> r.getStatus() == elearning.entity.ReadingActivity.Status.PUBLISHED)
                        .forEach(
                                r ->
                                        readingItems.add(
                                                item(
                                                        r.getId(),
                                                        r.getTitle(),
                                                        "READING",
                                                        lesson,
                                                        null,
                                                        null,
                                                        readingAttempts.existsByActivityIdAndStudentId(
                                                                        r.getId(), student.getId())
                                                                ? "COMPLETED"
                                                                : "NOT_STARTED")));
            }
        }
        return new ReviewResponse(personal, grammarItems, flashcardItems, readingItems);
    }

    /** Bài bị khóa, chưa ghi danh hay đang ẩn → bỏ qua (không phải lỗi của trang Ôn tập). */
    private boolean canOpen(User student, Lesson lesson) {
        try {
            lessonService.requireStudentAccess(student, lesson);
            return true;
        } catch (LearningAccessException | ResourceNotFoundException ex) {
            return false;
        }
    }

    private ReviewItem grammarItem(GrammarTopic topic, Lesson lesson, User student) {
        String status =
                grammarProgress
                        .findByStudentIdAndGrammarTopicId(student.getId(), topic.getId())
                        .map(p -> p.getStatus().name())
                        .orElse(StudentGrammarProgress.Status.NOT_STARTED.name());
        return item(topic.getId(), topic.getTitle(), "GRAMMAR", lesson, null, null, status);
    }

    private ReviewItem flashcardItem(FlashcardSet set, Lesson lesson, User student) {
        int total = (int) cards.countByFlashcardSetId(set.getId());
        int reviewed =
                (int)
                        cardProgress
                                .findAllByStudentIdAndFlashcardFlashcardSetId(
                                        student.getId(), set.getId())
                                .stream()
                                .filter(p -> p.getMemoryStatus() != FlashcardProgress.MemoryStatus.NEW)
                                .count();
        return item(set.getId(), set.getTitle(), "FLASHCARD", lesson, total, reviewed, null);
    }

    private static ReviewItem item(
            Long id, String title, String type, Lesson lesson, Integer total, Integer reviewed, String status) {
        if (lesson == null) {
            return new ReviewItem(id, title, type, null, null, null, null, null, null, total, reviewed, status);
        }
        var week = lesson.getCourseWeek();
        return new ReviewItem(
                id,
                title,
                type,
                week.getCourse().getId(),
                week.getCourse().getTitle(),
                week.getWeekNumber(),
                lesson.getId(),
                lesson.getSortOrder(),
                lesson.getTitle(),
                total,
                reviewed,
                status);
    }
}
