package elearning.entity;

import jakarta.persistence.*;

import java.util.*;

@Entity
@Table(name = "listening_questions")
public class ListeningQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listening_id", nullable = false)
    private ListeningActivity activity;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ListeningOption> options = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public ListeningActivity getActivity() {
        return activity;
    }

    public void setActivity(ListeningActivity v) {
        activity = v;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String v) {
        questionText = v;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer v) {
        sortOrder = v;
    }

    public List<ListeningOption> getOptions() {
        return options;
    }
}
