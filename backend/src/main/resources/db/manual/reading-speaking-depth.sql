SET @skill_type_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'reading_questions'
      AND column_name = 'skill_type'
);
SET @add_skill_type = IF(
    @skill_type_exists = 0,
    'ALTER TABLE reading_questions ADD COLUMN skill_type VARCHAR(24) NOT NULL DEFAULT ''DETAIL''',
    'SELECT 1'
);
PREPARE add_reading_skill_type FROM @add_skill_type;
EXECUTE add_reading_skill_type;
DEALLOCATE PREPARE add_reading_skill_type;

ALTER TABLE reading_attempts
    ADD COLUMN attempt_type VARCHAR(30) NOT NULL DEFAULT 'ASSESSMENT',
    ADD COLUMN practice_skill VARCHAR(30) NULL,
    ADD COLUMN assessment_slot INT NULL;

UPDATE reading_attempts
SET assessment_slot = 1
WHERE attempt_type = 'ASSESSMENT';

ALTER TABLE reading_attempts
    DROP INDEX uq_reading_attempt_activity_student,
    ADD UNIQUE KEY uq_reading_assessment_slot (reading_id, student_id, assessment_slot);

ALTER TABLE speaking_student_submissions
    ADD COLUMN revision_number INT NOT NULL DEFAULT 1,
    ADD COLUMN task_completion_score DECIMAL(5,2) NULL,
    ADD COLUMN task_completion_feedback TEXT NULL,
    ADD COLUMN fluency_score DECIMAL(5,2) NULL,
    ADD COLUMN fluency_feedback TEXT NULL,
    ADD COLUMN pronunciation_score DECIMAL(5,2) NULL,
    ADD COLUMN pronunciation_feedback TEXT NULL,
    ADD COLUMN vocabulary_grammar_score DECIMAL(5,2) NULL,
    ADD COLUMN vocabulary_grammar_feedback TEXT NULL;

SET @legacy_rubric_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'speaking_student_submissions'
      AND column_name IN (
          'rubric_task_achievement',
          'feedback_task_achievement',
          'rubric_fluency',
          'feedback_fluency',
          'rubric_pronunciation',
          'feedback_pronunciation',
          'rubric_vocabulary_grammar',
          'feedback_vocabulary_grammar'
      )
);
SET @legacy_rubric_copy = IF(
    @legacy_rubric_exists = 8,
    'UPDATE speaking_student_submissions
     SET task_completion_score = rubric_task_achievement,
         task_completion_feedback = feedback_task_achievement,
         fluency_score = rubric_fluency,
         fluency_feedback = feedback_fluency,
         pronunciation_score = rubric_pronunciation,
         pronunciation_feedback = feedback_pronunciation,
         vocabulary_grammar_score = rubric_vocabulary_grammar,
         vocabulary_grammar_feedback = feedback_vocabulary_grammar',
    'SELECT 1'
);
PREPARE copy_legacy_rubric FROM @legacy_rubric_copy;
EXECUTE copy_legacy_rubric;
DEALLOCATE PREPARE copy_legacy_rubric;

CREATE TABLE speaking_submission_revisions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    submission_id BIGINT UNSIGNED NOT NULL,
    revision_number INT NOT NULL,
    recording_url VARCHAR(1000) NOT NULL,
    submitted_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_speaking_submission_revision (submission_id, revision_number),
    CONSTRAINT fk_speaking_revision_submission
        FOREIGN KEY (submission_id)
        REFERENCES speaking_student_submissions (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO speaking_submission_revisions
    (submission_id, revision_number, recording_url, submitted_at)
SELECT id, revision_number, recording_url, submitted_at
FROM speaking_student_submissions;
