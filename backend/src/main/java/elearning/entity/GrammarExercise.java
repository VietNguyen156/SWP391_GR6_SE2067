package elearning.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/** Một bài tập sau chủ đề ngữ pháp: trắc nghiệm hoặc điền chỗ trống. */
@Entity
@Table(name = "grammar_exercises")
public class GrammarExercise {
    public enum Type {
        MULTIPLE_CHOICE,
        FILL_BLANK
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grammar_topic_id", nullable = false)
    private GrammarTopic grammarTopic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type = Type.MULTIPLE_CHOICE;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    /** Điền chỗ trống: các đáp án chấp nhận, ngăn cách bằng dấu | (vd. "has been|'s been"). */
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<GrammarExerciseOption> options = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public GrammarTopic getGrammarTopic() {
        return grammarTopic;
    }

    public void setGrammarTopic(GrammarTopic v) {
        grammarTopic = v;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type v) {
        type = v;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String v) {
        questionText = v;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String v) {
        correctAnswer = v;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String v) {
        explanation = v;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer v) {
        sortOrder = v;
    }

    public List<GrammarExerciseOption> getOptions() {
        return options;
    }
}
