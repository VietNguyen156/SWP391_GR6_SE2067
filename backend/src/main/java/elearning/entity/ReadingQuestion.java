package elearning.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reading_questions")
public class ReadingQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reading_id", nullable = false)
    private ReadingActivity activity;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    /** Giải thích đáp án (hiện sau khi nộp). */
    @Column(columnDefinition = "TEXT")
    private String explanation;

    /** Câu/đoạn trích nguyên văn trong bài đọc làm căn cứ; tô sáng sau khi nộp. */
    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ReadingOption> options = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public ReadingActivity getActivity() {
        return activity;
    }

    public void setActivity(ReadingActivity v) {
        activity = v;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String v) {
        questionText = v;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String v) {
        explanation = v;
    }

    public String getEvidence() {
        return evidence;
    }

    public void setEvidence(String v) {
        evidence = v;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer v) {
        sortOrder = v;
    }

    public List<ReadingOption> getOptions() {
        return options;
    }
}
