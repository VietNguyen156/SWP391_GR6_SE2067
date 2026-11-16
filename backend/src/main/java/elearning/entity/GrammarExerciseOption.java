package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "grammar_exercise_options")
public class GrammarExerciseOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private GrammarExercise exercise;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    public Long getId() {
        return id;
    }

    public GrammarExercise getExercise() {
        return exercise;
    }

    public void setExercise(GrammarExercise v) {
        exercise = v;
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
    }
}
