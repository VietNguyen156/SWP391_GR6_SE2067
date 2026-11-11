package elearning.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_bank_listening_questions")
public class TestBankListeningQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private TestBankListeningItem item;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<TestBankListeningOption> options = new ArrayList<>();

    public Long getId() { return id; }
    public TestBankListeningItem getItem() { return item; }
    public void setItem(TestBankListeningItem v) { item = v; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String v) { questionText = v; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer v) { sortOrder = v; }
    public List<TestBankListeningOption> getOptions() { return options; }
}
