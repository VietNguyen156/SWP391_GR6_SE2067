package elearning.service;

import elearning.entity.CourseWeek;
import elearning.entity.Flashcard;
import elearning.entity.FlashcardSet;
import elearning.entity.GrammarContent;
import elearning.entity.GrammarTopic;
import elearning.entity.Lesson;
import elearning.entity.ListeningActivity;
import elearning.entity.ListeningOption;
import elearning.entity.ListeningQuestion;
import elearning.entity.ReadingActivity;
import elearning.entity.ReadingOption;
import elearning.entity.ReadingQuestion;
import elearning.entity.SpeakingActivity;
import elearning.entity.User;
import elearning.repository.FlashcardRepository;
import elearning.repository.FlashcardSetRepository;
import elearning.repository.GrammarContentRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.ListeningQuestionRepository;
import elearning.repository.ReadingActivityRepository;
import elearning.repository.ReadingQuestionRepository;
import elearning.repository.SpeakingActivityRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sao chép học liệu của một bài học sang bài học mới khi nhân bản khóa học (Grammar, Flashcard,
 * Listening, Reading, Speaking). Chỉ chép phần nội dung: tiêu đề, văn bản, câu hỏi và đáp án.
 * Không chép bài nộp, kết quả, tiến độ và tệp đính kèm (Reading). Listening dùng chung đường dẫn
 * audio với bản gốc; xóa bài không xóa tệp audio nên dùng chung là an toàn.
 */
@Service
@Transactional
public class CourseContentCopier {
    private final GrammarTopicRepository grammar;
    private final GrammarContentRepository grammarContents;
    private final FlashcardSetRepository flashcardSets;
    private final FlashcardRepository flashcards;
    private final ListeningActivityRepository listening;
    private final ListeningQuestionRepository listeningQuestions;
    private final ReadingActivityRepository reading;
    private final ReadingQuestionRepository readingQuestions;
    private final SpeakingActivityRepository speaking;

    public CourseContentCopier(
            GrammarTopicRepository grammar,
            GrammarContentRepository grammarContents,
            FlashcardSetRepository flashcardSets,
            FlashcardRepository flashcards,
            ListeningActivityRepository listening,
            ListeningQuestionRepository listeningQuestions,
            ReadingActivityRepository reading,
            ReadingQuestionRepository readingQuestions,
            SpeakingActivityRepository speaking) {
        this.grammar = grammar;
        this.grammarContents = grammarContents;
        this.flashcardSets = flashcardSets;
        this.flashcards = flashcards;
        this.listening = listening;
        this.listeningQuestions = listeningQuestions;
        this.reading = reading;
        this.readingQuestions = readingQuestions;
        this.speaking = speaking;
    }

    /** Chép mọi học liệu của {@code source} vào bài {@code target} (thuộc tuần {@code week}). */
    public void copyMaterials(Lesson source, Lesson target, CourseWeek week, User teacher) {
        Long sourceId = source.getId();
        copyGrammar(sourceId, target, week, teacher);
        copyFlashcards(sourceId, target, week, teacher);
        copyListening(sourceId, target, week, teacher);
        copyReading(sourceId, target, week, teacher);
        copySpeaking(sourceId, target, week, teacher);
    }

    private void copyGrammar(Long sourceId, Lesson target, CourseWeek week, User teacher) {
        for (GrammarTopic topic : grammar.findAllByLessonIdOrderByCreatedAtAsc(sourceId)) {
            GrammarTopic copy = new GrammarTopic();
            copy.setCreatedByTeacher(teacher);
            copy.setCourseWeek(week);
            copy.setLesson(target);
            copy.setTitle(topic.getTitle());
            copy.setDescription(topic.getDescription());
            copy.setLevel(topic.getLevel());
            copy.setStatus(topic.getStatus());
            grammar.save(copy);
            for (GrammarContent content :
                    grammarContents.findAllByGrammarTopicIdOrderBySortOrderAsc(topic.getId())) {
                GrammarContent contentCopy = new GrammarContent();
                contentCopy.setGrammarTopic(copy);
                contentCopy.setRuleContent(content.getRuleContent());
                contentCopy.setExamples(content.getExamples());
                contentCopy.setNotes(content.getNotes());
                contentCopy.setSortOrder(content.getSortOrder());
                grammarContents.save(contentCopy);
            }
        }
    }

    private void copyFlashcards(Long sourceId, Lesson target, CourseWeek week, User teacher) {
        for (FlashcardSet set : flashcardSets.findAllByLessonIdOrderByCreatedAtAsc(sourceId)) {
            FlashcardSet copy = new FlashcardSet();
            copy.setCreatedByUser(teacher);
            copy.setCourseWeek(week);
            copy.setLesson(target);
            copy.setTitle(set.getTitle());
            copy.setDescription(set.getDescription());
            copy.setTopic(set.getTopic());
            copy.setToeicPart(set.getToeicPart());
            copy.setDifficulty(set.getDifficulty());
            copy.setStatus(set.getStatus());
            flashcardSets.save(copy);
            for (Flashcard card : flashcards.findAllByFlashcardSetIdOrderBySortOrderAsc(set.getId())) {
                Flashcard cardCopy = new Flashcard();
                cardCopy.setFlashcardSet(copy);
                cardCopy.setFrontText(card.getFrontText());
                cardCopy.setBackText(card.getBackText());
                cardCopy.setPronunciation(card.getPronunciation());
                cardCopy.setWordType(card.getWordType());
                cardCopy.setExampleSentence(card.getExampleSentence());
                cardCopy.setImageUrl(card.getImageUrl());
                cardCopy.setAudioUrl(card.getAudioUrl());
                cardCopy.setSortOrder(card.getSortOrder());
                flashcards.save(cardCopy);
            }
        }
    }

    private void copyListening(Long sourceId, Lesson target, CourseWeek week, User teacher) {
        for (ListeningActivity activity : listening.findAllByLessonIdOrderByCreatedAtAsc(sourceId)) {
            ListeningActivity copy = new ListeningActivity();
            copy.setCourseWeek(week);
            copy.setTeacher(teacher);
            copy.setLesson(target);
            copy.setTitle(activity.getTitle());
            copy.setDescription(activity.getDescription());
            copy.setInstruction(activity.getInstruction());
            copy.setAudioUrl(activity.getAudioUrl());
            copy.setStatus(activity.getStatus());
            listening.save(copy);
            for (ListeningQuestion question :
                    listeningQuestions.findAllByActivityIdOrderBySortOrderAsc(activity.getId())) {
                ListeningQuestion questionCopy = new ListeningQuestion();
                questionCopy.setActivity(copy);
                questionCopy.setQuestionText(question.getQuestionText());
                questionCopy.setSortOrder(question.getSortOrder());
                for (ListeningOption option : question.getOptions()) {
                    ListeningOption optionCopy = new ListeningOption();
                    optionCopy.setQuestion(questionCopy);
                    optionCopy.setOptionText(option.getOptionText());
                    optionCopy.setCorrect(option.isCorrect());
                    optionCopy.setSortOrder(option.getSortOrder());
                    questionCopy.getOptions().add(optionCopy);
                }
                listeningQuestions.save(questionCopy);
            }
        }
    }

    private void copyReading(Long sourceId, Lesson target, CourseWeek week, User teacher) {
        for (ReadingActivity activity : reading.findAllByLessonIdOrderByCreatedAtAsc(sourceId)) {
            ReadingActivity copy = new ReadingActivity();
            copy.setCourseWeek(week);
            copy.setTeacher(teacher);
            copy.setLesson(target);
            copy.setTitle(activity.getTitle());
            copy.setDescription(activity.getDescription());
            copy.setInstruction(activity.getInstruction());
            copy.setPassage(activity.getPassage());
            copy.setPassageFormat(activity.getPassageFormat());
            copy.setToeicPart(activity.getToeicPart());
            copy.setPassageType(activity.getPassageType());
            // Tệp đính kèm không được chép: bài không có đoạn văn thì chưa có nội dung đọc → nháp.
            boolean hasPassage = activity.getPassage() != null && !activity.getPassage().isBlank();
            copy.setStatus(hasPassage ? activity.getStatus() : ReadingActivity.Status.DRAFT);
            reading.save(copy);
            for (ReadingQuestion question :
                    readingQuestions.findAllByActivityIdOrderBySortOrderAsc(activity.getId())) {
                ReadingQuestion questionCopy = new ReadingQuestion();
                questionCopy.setActivity(copy);
                questionCopy.setQuestionText(question.getQuestionText());
                questionCopy.setExplanation(question.getExplanation());
                questionCopy.setEvidence(question.getEvidence());
                questionCopy.setSkillType(question.getSkillType());
                questionCopy.setSortOrder(question.getSortOrder());
                for (ReadingOption option : question.getOptions()) {
                    ReadingOption optionCopy = new ReadingOption();
                    optionCopy.setQuestion(questionCopy);
                    optionCopy.setOptionText(option.getOptionText());
                    optionCopy.setCorrect(option.isCorrect());
                    optionCopy.setSortOrder(option.getSortOrder());
                    questionCopy.getOptions().add(optionCopy);
                }
                readingQuestions.save(questionCopy);
            }
        }
    }

    private void copySpeaking(Long sourceId, Lesson target, CourseWeek week, User teacher) {
        for (SpeakingActivity activity : speaking.findAllByLessonIdOrderByCreatedAtAsc(sourceId)) {
            SpeakingActivity copy = new SpeakingActivity();
            copy.setCourseWeek(week);
            copy.setTeacher(teacher);
            copy.setLesson(target);
            copy.setTitle(activity.getTitle());
            copy.setInstruction(activity.getInstruction());
            copy.setPromptText(activity.getPromptText());
            copy.setStatus(activity.getStatus());
            speaking.save(copy);
        }
    }
}
