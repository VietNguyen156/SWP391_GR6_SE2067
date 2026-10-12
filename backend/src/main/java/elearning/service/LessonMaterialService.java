package elearning.service;

import elearning.dto.CurriculumDto.WeekSummary.ContentRef;
import elearning.entity.Lesson;
import elearning.entity.LessonContent;
import elearning.entity.Quiz;
import elearning.repository.FlashcardSetRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.LessonContentRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.QuizRepository;
import elearning.repository.SpeakingActivityRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Nguồn duy nhất cho "học liệu của một bài học".
 *
 * <p>Cấu trúc chuẩn: Khóa học → Tuần → Bài học → Học liệu. Mỗi học liệu thuộc đúng một bài học.
 * Thứ tự hiển thị trong một bài: Bài giảng → Ngữ pháp → Flashcard → Listening → Speaking → Quiz.
 */
@Service
@Transactional(readOnly = true)
public class LessonMaterialService {
    public static final String LECTURE = "LECTURE";
    public static final String GRAMMAR = "GRAMMAR";
    public static final String FLASHCARD = "FLASHCARD";
    public static final String LISTENING = "LISTENING";
    public static final String SPEAKING = "SPEAKING";
    public static final String QUIZ = "QUIZ";

    private static final String PUBLISHED = "PUBLISHED";

    private final LessonContentRepository contents;
    private final GrammarTopicRepository grammar;
    private final FlashcardSetRepository flashcards;
    private final ListeningActivityRepository listening;
    private final SpeakingActivityRepository speaking;
    private final QuizRepository quizzes;

    public LessonMaterialService(
            LessonContentRepository contents,
            GrammarTopicRepository grammar,
            FlashcardSetRepository flashcards,
            ListeningActivityRepository listening,
            SpeakingActivityRepository speaking,
            QuizRepository quizzes) {
        this.contents = contents;
        this.grammar = grammar;
        this.flashcards = flashcards;
        this.listening = listening;
        this.speaking = speaking;
        this.quizzes = quizzes;
    }

    /**
     * @param studentView true: chỉ trả về học liệu học viên được thấy (đã xuất bản / đang hiển thị)
     * @param speakingStatus trạng thái bài nói của học viên, theo id hoạt động Speaking
     */
    public List<ContentRef> materials(
            Lesson lesson, boolean studentView, Map<Long, String> speakingStatus) {
        Long lessonId = lesson.getId();
        List<ContentRef> result = new ArrayList<>();

        for (LessonContent item : visibleContents(lessonId, studentView)) {
            result.add(
                    new ContentRef(
                            item.getId(),
                            lessonId,
                            item.getTitle() == null || item.getTitle().isBlank()
                                    ? "Bài giảng"
                                    : item.getTitle(),
                            item.getStatus() == LessonContent.Status.ACTIVE ? PUBLISHED : "DRAFT",
                            LECTURE,
                            item.getContentType().name()));
        }
        grammar.findAllByLessonIdOrderByCreatedAtAsc(lessonId).stream()
                .filter(item -> !studentView || PUBLISHED.equals(item.getStatus().name()))
                .forEach(
                        item ->
                                result.add(
                                        new ContentRef(
                                                item.getId(),
                                                lessonId,
                                                item.getTitle(),
                                                item.getStatus().name(),
                                                GRAMMAR,
                                                item.getLevel() == null
                                                        ? null
                                                        : item.getLevel().name())));
        flashcards.findAllByLessonIdOrderByCreatedAtAsc(lessonId).stream()
                .filter(item -> !studentView || PUBLISHED.equals(item.getStatus().name()))
                .forEach(
                        item ->
                                result.add(
                                        new ContentRef(
                                                item.getId(),
                                                lessonId,
                                                item.getTitle(),
                                                item.getStatus().name(),
                                                FLASHCARD,
                                                item.getTopic())));
        listening.findAllByLessonIdOrderByCreatedAtAsc(lessonId).stream()
                .filter(item -> !studentView || PUBLISHED.equals(item.getStatus().name()))
                .forEach(
                        item ->
                                result.add(
                                        new ContentRef(
                                                item.getId(),
                                                lessonId,
                                                item.getTitle(),
                                                item.getStatus().name(),
                                                LISTENING,
                                                null)));
        speaking.findAllByLessonIdOrderByCreatedAtAsc(lessonId).stream()
                .filter(item -> !studentView || PUBLISHED.equals(item.getStatus().name()))
                .forEach(
                        item ->
                                result.add(
                                        new ContentRef(
                                                item.getId(),
                                                lessonId,
                                                item.getTitle(),
                                                item.getStatus().name(),
                                                SPEAKING,
                                                speakingStatus == null
                                                        ? null
                                                        : speakingStatus.get(item.getId()))));
        quizzes.findAllByLessonIdOrderByCreatedAtAsc(lessonId).stream()
                .filter(item -> !studentView || item.getStatus() == Quiz.Status.PUBLISHED)
                .forEach(
                        item ->
                                result.add(
                                        new ContentRef(
                                                item.getId(),
                                                lessonId,
                                                item.getTitle(),
                                                item.getStatus().name(),
                                                QUIZ,
                                                item.getTotalQuestion() + " câu")));
        return result;
    }

    /** Bài giảng (text / video / audio / PDF / link) của bài học, theo thứ tự sắp xếp. */
    public List<LessonContent> visibleContents(Long lessonId, boolean studentView) {
        return contents.findAllByLessonIdOrderBySortOrderAsc(lessonId).stream()
                .filter(item -> !studentView || item.getStatus() == LessonContent.Status.ACTIVE)
                .toList();
    }

    /** Bài học còn bất kỳ học liệu nào (kể cả bài giảng và quiz) hay không. */
    public boolean hasMaterials(Long lessonId) {
        return contents.existsByLessonId(lessonId)
                || grammar.existsByLessonId(lessonId)
                || flashcards.existsByLessonId(lessonId)
                || listening.existsByLessonId(lessonId)
                || speaking.existsByLessonId(lessonId)
                || quizzes.existsByLessonId(lessonId);
    }
}
