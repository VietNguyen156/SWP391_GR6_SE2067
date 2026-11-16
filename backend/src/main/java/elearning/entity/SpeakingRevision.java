package elearning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "speaking_submission_revisions",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_speaking_submission_revision",
                        columnNames = {"submission_id", "revision_number"}))
public class SpeakingRevision {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private SpeakingSubmission submission;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber;

    @Column(name = "recording_url", nullable = false, length = 1000)
    private String recordingUrl;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    void prePersist() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public SpeakingSubmission getSubmission() {
        return submission;
    }

    public void setSubmission(SpeakingSubmission value) {
        submission = value;
    }

    public Integer getRevisionNumber() {
        return revisionNumber;
    }

    public void setRevisionNumber(Integer value) {
        revisionNumber = value;
    }

    public String getRecordingUrl() {
        return recordingUrl;
    }

    public void setRecordingUrl(String value) {
        recordingUrl = value;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime value) {
        submittedAt = value;
    }
}
