package elearning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_questions")
@IdClass(QuizQuestionId.class)
public class QuizQuestion {
    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz v) {
        quiz = v;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question v) {
        question = v;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer v) {
        sortOrder = v;
    }
}
