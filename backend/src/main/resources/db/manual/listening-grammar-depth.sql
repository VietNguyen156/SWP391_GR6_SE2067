-- Nâng cấp Listening và Grammar (chạy thủ công; backend dùng ddl-auto=validate).
-- Có thể chạy lại nhiều lần: mỗi cột/bảng/chỉ mục chỉ được tạo khi chưa có.
-- Nên sao lưu DB trước khi chạy.

-- ====================== LISTENING ======================
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_activities' AND column_name = 'transcript');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_activities ADD COLUMN transcript TEXT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_questions' AND column_name = 'skill_type');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_questions ADD COLUMN skill_type VARCHAR(24) NOT NULL DEFAULT ''DETAIL''', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_questions' AND column_name = 'transcript_excerpt');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_questions ADD COLUMN transcript_excerpt TEXT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_questions' AND column_name = 'audio_start_sec');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_questions ADD COLUMN audio_start_sec INT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_questions' AND column_name = 'audio_end_sec');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_questions ADD COLUMN audio_end_sec INT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_attempts' AND column_name = 'attempt_type');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_attempts ADD COLUMN attempt_type VARCHAR(30) NOT NULL DEFAULT ''ASSESSMENT''', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_attempts' AND column_name = 'practice_skill');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_attempts ADD COLUMN practice_skill VARCHAR(30) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'listening_attempts' AND column_name = 'assessment_slot');
SET @sql = IF(@c = 0, 'ALTER TABLE listening_attempts ADD COLUMN assessment_slot INT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Lượt nộp cũ đều là lượt chính thức.
UPDATE listening_attempts SET assessment_slot = 1 WHERE attempt_type = 'ASSESSMENT' AND assessment_slot IS NULL;

-- Khóa duy nhất chỉ ràng buộc lượt chính thức (lượt luyện có assessment_slot = NULL nên không vướng).
SET @old_idx = (SELECT COUNT(*) FROM information_schema.statistics
                WHERE table_schema = DATABASE() AND table_name = 'listening_attempts'
                  AND index_name = 'uq_listening_attempt_activity_student');
SET @new_idx = (SELECT COUNT(*) FROM information_schema.statistics
                WHERE table_schema = DATABASE() AND table_name = 'listening_attempts'
                  AND index_name = 'uq_listening_assessment_slot');
SET @sql = IF(@new_idx = 0,
    IF(@old_idx > 0,
       'ALTER TABLE listening_attempts DROP INDEX uq_listening_attempt_activity_student, ADD UNIQUE KEY uq_listening_assessment_slot (listening_id, student_id, assessment_slot)',
       'ALTER TABLE listening_attempts ADD UNIQUE KEY uq_listening_assessment_slot (listening_id, student_id, assessment_slot)'),
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ====================== GRAMMAR ======================
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'grammar_topics' AND column_name = 'pass_score');
SET @sql = IF(@c = 0, 'ALTER TABLE grammar_topics ADD COLUMN pass_score INT NOT NULL DEFAULT 70', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'student_grammar_progress' AND column_name = 'mastery');
SET @sql = IF(@c = 0, 'ALTER TABLE student_grammar_progress ADD COLUMN mastery VARCHAR(20) NOT NULL DEFAULT ''NEW''', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'student_grammar_progress' AND column_name = 'best_score');
SET @sql = IF(@c = 0, 'ALTER TABLE student_grammar_progress ADD COLUMN best_score DECIMAL(5,2) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'student_grammar_progress' AND column_name = 'last_score');
SET @sql = IF(@c = 0, 'ALTER TABLE student_grammar_progress ADD COLUMN last_score DECIMAL(5,2) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'student_grammar_progress' AND column_name = 'exercise_attempts');
SET @sql = IF(@c = 0, 'ALTER TABLE student_grammar_progress ADD COLUMN exercise_attempts INT NOT NULL DEFAULT 0', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @c = (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = 'student_grammar_progress' AND column_name = 'last_practiced_at');
SET @sql = IF(@c = 0, 'ALTER TABLE student_grammar_progress ADD COLUMN last_practiced_at DATETIME NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS grammar_exercises (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    grammar_topic_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    question_text TEXT NOT NULL,
    correct_answer TEXT NULL,
    explanation TEXT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_grammar_exercise_topic (grammar_topic_id, sort_order),
    CONSTRAINT fk_grammar_exercise_topic FOREIGN KEY (grammar_topic_id)
        REFERENCES grammar_topics (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grammar_exercise_options (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exercise_id BIGINT UNSIGNED NOT NULL,
    option_text TEXT NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_grammar_option_exercise (exercise_id),
    CONSTRAINT fk_grammar_option_exercise FOREIGN KEY (exercise_id)
        REFERENCES grammar_exercises (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grammar_exercise_attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id BIGINT UNSIGNED NOT NULL,
    grammar_topic_id BIGINT UNSIGNED NOT NULL,
    score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    correct_count INT NOT NULL DEFAULT 0,
    total_count INT NOT NULL DEFAULT 0,
    pass_score INT NOT NULL DEFAULT 70,
    passed TINYINT(1) NOT NULL DEFAULT 0,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_grammar_attempt_student_topic (student_id, grammar_topic_id, submitted_at),
    KEY idx_grammar_attempt_topic (grammar_topic_id),
    CONSTRAINT fk_grammar_attempt_student FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_grammar_attempt_topic FOREIGN KEY (grammar_topic_id)
        REFERENCES grammar_topics (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grammar_exercise_answers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id BIGINT UNSIGNED NOT NULL,
    exercise_id BIGINT UNSIGNED NOT NULL,
    option_id BIGINT UNSIGNED NULL,
    answer_text TEXT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_grammar_answer (attempt_id, exercise_id),
    KEY idx_grammar_answer_exercise (exercise_id),
    CONSTRAINT fk_grammar_answer_attempt FOREIGN KEY (attempt_id)
        REFERENCES grammar_exercise_attempts (id) ON DELETE CASCADE,
    CONSTRAINT fk_grammar_answer_exercise FOREIGN KEY (exercise_id)
        REFERENCES grammar_exercises (id) ON DELETE CASCADE,
    CONSTRAINT fk_grammar_answer_option FOREIGN KEY (option_id)
        REFERENCES grammar_exercise_options (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
