package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "grammar_contents")
public class GrammarContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grammar_topic_id", nullable = false)
    private GrammarTopic grammarTopic;

    @Column(name = "rule_content", columnDefinition = "LONGTEXT")
    private String ruleContent;

    @Column(columnDefinition = "LONGTEXT")
    private String examples;

    @Column(columnDefinition = "LONGTEXT")
    private String notes;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GrammarTopic getGrammarTopic() {
        return grammarTopic;
    }

    public void setGrammarTopic(GrammarTopic v) {
        grammarTopic = v;
    }

    public String getRuleContent() {
        return ruleContent;
    }

    public void setRuleContent(String v) {
        ruleContent = v;
    }

    public String getExamples() {
        return examples;
    }

    public void setExamples(String v) {
        examples = v;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String v) {
        notes = v;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer v) {
        sortOrder = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
