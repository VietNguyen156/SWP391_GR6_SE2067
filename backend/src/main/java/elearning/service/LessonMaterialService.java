package elearning.service;

import elearning.dto.CurriculumDto.WeekSummary.ContentRef;
import elearning.entity.Lesson;
import elearning.repository.FlashcardSetRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.ReadingActivityRepository;
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
 * Thứ tự hiển thị trong một bài: Ngữ pháp → Flashcard → Listening → Reading → Speaking.
 */
@Service
@Transactional(readOnly = true)
public class LessonMaterialService {
    public static final String GRAMMAR = "GRAMMAR";
    public static final String FLASHCARD = "FLASHCARD";
    public static final String LISTENING = "LISTENING";
    public static final String READING = "READING";
    public static final String SPEAKING = "SPEAKING";

    private static final String PUBLISHED = "PUBLISHED";

    private final GrammarTopicRepository grammar;
    private final FlashcardSetRepository flashcards;
    private final ListeningActivityRepository listening;
    private final ReadingActivityRepository reading;
    private final SpeakingActivityRepository speaking;

    public LessonMaterialService(
            GrammarTopicRepository grammar,
            FlashcardSetRepository flashcards,
            ListeningActivityRepository listening,
            ReadingActivityRepository reading,
            SpeakingActivityRepository speaking) {
        this.grammar = grammar;
        this.flashcards = flashcards;
        this.listening = listening;
        this.reading = reading;
        this.speaking = speaking;
    }

    /**
     * @param studentView true: chỉ trả về học liệu học viên được thấy (đã xuất bản / đang hiển thị)
     * @param speakingStatus trạng thái bài nói của học viên, theo id hoạt động Speaking
     */
    public List<ContentRef> materials(
            Lesson lesson, boolean studentView, Map<Long, String> speakingStatus) {
        Long lessonId = lesson.getId();
        List<ContentRef> result = new ArrayList<>();

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
        reading.findAllByLessonIdOrderByCreatedAtAsc(lessonId).stream()
                .filter(item -> !studentView || PUBLISHED.equals(item.getStatus().name()))
                .forEach(
                        item ->
                                result.add(
                                        new ContentRef(
                                                item.getId(),
                                                lessonId,
                                                item.getTitle(),
                                                item.getStatus().name(),
                                                READING,
                                                item.getToeicPart().name())));
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
        return result;
    }

    /** Bài học còn bất kỳ học liệu nào hay không. */
    public boolean hasMaterials(Long lessonId) {
        return grammar.existsByLessonId(lessonId)
                || flashcards.existsByLessonId(lessonId)
                || listening.existsByLessonId(lessonId)
                || reading.existsByLessonId(lessonId)
                || speaking.existsByLessonId(lessonId);
    }
}
