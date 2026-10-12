package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "listening_options")
public class ListeningOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private ListeningQuestion question;

    @Column(name = "option_key", nullable = false, length = 10)
    private String optionKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    public Long getId() {
        return id;
    }

    public ListeningQuestion getQuestion() {
        return question;
    }

    public void setQuestion(ListeningQuestion v) {
        question = v;
    }

    public String getOptionText() {
        return optionText;
    }

    public void setOptionText(String v) {
        optionText = v;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean v) {
        correct = v;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer v) {
        sortOrder = v;
        optionKey = v != null && v >= 1 && v <= 26
                ? String.valueOf((char) ('A' + v - 1)) : String.valueOf(v);
    }
}
