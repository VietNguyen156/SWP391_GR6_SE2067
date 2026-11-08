package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "test_bank_listening_options")
public class TestBankListeningOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private TestBankListeningQuestion question;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    public Long getId() { return id; }
    public TestBankListeningQuestion getQuestion() { return question; }
    public void setQuestion(TestBankListeningQuestion v) { question = v; }
    public String getOptionText() { return optionText; }
    public void setOptionText(String v) { optionText = v; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean v) { correct = v; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer v) { sortOrder = v; }
}
