package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "test_bank_reading_options")
public class TestBankReadingOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private TestBankReadingQuestion question;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    public Long getId() { return id; }
    public TestBankReadingQuestion getQuestion() { return question; }
    public void setQuestion(TestBankReadingQuestion v) { question = v; }
    public String getOptionText() { return optionText; }
    public void setOptionText(String v) { optionText = v; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean v) { correct = v; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer v) { sortOrder = v; }
}
