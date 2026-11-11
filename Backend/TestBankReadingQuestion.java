package elearning.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_bank_reading_questions")
public class TestBankReadingQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private TestBankReadingItem item;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<TestBankReadingOption> options = new ArrayList<>();

    public Long getId() { return id; }
    public TestBankReadingItem getItem() { return item; }
    public void setItem(TestBankReadingItem v) { item = v; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String v) { questionText = v; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer v) { sortOrder = v; }
    public List<TestBankReadingOption> getOptions() { return options; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String v) { explanation = v; }
    public String getEvidence() { return evidence; }
    public void setEvidence(String v) { evidence = v; }
}
