package elearning.entity;

import jakarta.persistence.*;

import java.util.*;

@Entity
@Table(name = "listening_questions")
public class ListeningQuestion {
    public enum SkillType {
        MAIN_IDEA,
        DETAIL,
        PURPOSE,
        INFERENCE
    }

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

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_type", nullable = false, length = 24)
    private SkillType skillType = SkillType.DETAIL;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "transcript_excerpt", columnDefinition = "TEXT")
    private String transcriptExcerpt;

    @Column(name = "audio_start_sec")
    private Integer audioStartSec;

    @Column(name = "audio_end_sec")
    private Integer audioEndSec;

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

    public SkillType getSkillType() {
        return skillType;
    }

    public void setSkillType(SkillType v) {
        skillType = v == null ? SkillType.DETAIL : v;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String v) {
        explanation = v;
    }

    public String getTranscriptExcerpt() {
        return transcriptExcerpt;
    }

    public void setTranscriptExcerpt(String v) {
        transcriptExcerpt = v;
    }

    public Integer getAudioStartSec() {
        return audioStartSec;
    }

    public void setAudioStartSec(Integer v) {
        audioStartSec = v;
    }

    public Integer getAudioEndSec() {
        return audioEndSec;
    }

    public void setAudioEndSec(Integer v) {
        audioEndSec = v;
    }

    public List<ListeningOption> getOptions() {
        return options;
    }
}
