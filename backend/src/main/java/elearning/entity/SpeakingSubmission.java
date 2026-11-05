package elearning.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "speaking_student_submissions")
public class SpeakingSubmission {
    public enum Status {
        SUBMITTED,
        GRADED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "speaking_id")
    private SpeakingActivity activity;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    @Column(name = "recording_url", nullable = false, length = 1000)
    private String recordingUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.SUBMITTED;

    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by_teacher_id")
    private User gradedBy;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber = 1;

    @Column(name = "task_completion_score", precision = 5, scale = 2)
    private BigDecimal taskCompletionScore;

    @Column(name = "task_completion_feedback", columnDefinition = "TEXT")
    private String taskCompletionFeedback;

    @Column(name = "fluency_score", precision = 5, scale = 2)
    private BigDecimal fluencyScore;

    @Column(name = "fluency_feedback", columnDefinition = "TEXT")
    private String fluencyFeedback;

    @Column(name = "pronunciation_score", precision = 5, scale = 2)
    private BigDecimal pronunciationScore;

    @Column(name = "pronunciation_feedback", columnDefinition = "TEXT")
    private String pronunciationFeedback;

    @Column(name = "vocabulary_grammar_score", precision = 5, scale = 2)
    private BigDecimal vocabularyGrammarScore;

    @Column(name = "vocabulary_grammar_feedback", columnDefinition = "TEXT")
    private String vocabularyGrammarFeedback;

    @PrePersist
    void pre() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public SpeakingActivity getActivity() {
        return activity;
    }

    public void setActivity(SpeakingActivity v) {
        activity = v;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User v) {
        student = v;
    }

    public String getRecordingUrl() {
        return recordingUrl;
    }

    public void setRecordingUrl(String v) {
        recordingUrl = v;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status v) {
        status = v;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal v) {
        score = v;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String v) {
        feedback = v;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime v) {
        submittedAt = v;
    }

    public LocalDateTime getGradedAt() {
        return gradedAt;
    }

    public void setGradedAt(LocalDateTime v) {
        gradedAt = v;
    }

    public User getGradedBy() {
        return gradedBy;
    }

    public void setGradedBy(User v) {
        gradedBy = v;
    }

    public Integer getRevisionNumber() {
        return revisionNumber;
    }

    public void setRevisionNumber(Integer v) {
        revisionNumber = v;
    }

    public BigDecimal getTaskCompletionScore() {
        return taskCompletionScore;
    }

    public void setTaskCompletionScore(BigDecimal v) {
        taskCompletionScore = v;
    }

    public String getTaskCompletionFeedback() {
        return taskCompletionFeedback;
    }

    public void setTaskCompletionFeedback(String v) {
        taskCompletionFeedback = v;
    }

    public BigDecimal getFluencyScore() {
        return fluencyScore;
    }

    public void setFluencyScore(BigDecimal v) {
        fluencyScore = v;
    }

    public String getFluencyFeedback() {
        return fluencyFeedback;
    }

    public void setFluencyFeedback(String v) {
        fluencyFeedback = v;
    }

    public BigDecimal getPronunciationScore() {
        return pronunciationScore;
    }

    public void setPronunciationScore(BigDecimal v) {
        pronunciationScore = v;
    }

    public String getPronunciationFeedback() {
        return pronunciationFeedback;
    }

    public void setPronunciationFeedback(String v) {
        pronunciationFeedback = v;
    }

    public BigDecimal getVocabularyGrammarScore() {
        return vocabularyGrammarScore;
    }

    public void setVocabularyGrammarScore(BigDecimal v) {
        vocabularyGrammarScore = v;
    }

    public String getVocabularyGrammarFeedback() {
        return vocabularyGrammarFeedback;
    }

    public void setVocabularyGrammarFeedback(String v) {
        vocabularyGrammarFeedback = v;
    }
}
