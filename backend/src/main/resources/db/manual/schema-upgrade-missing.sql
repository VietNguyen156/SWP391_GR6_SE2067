-- Schema-only additive upgrade from the supplied MySQL dump.
-- No INSERT, UPDATE, DROP, or row data is included.
-- Existing tables are preserved; only missing columns/tables are added.

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'daily_learning_statistics' AND column_name = 'test_completed');
SET @sql = IF(@c = 0, 'ALTER TABLE `daily_learning_statistics` ADD COLUMN `test_completed` int(10) unsigned NOT NULL DEFAULT 0', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'password_reset_tokens' AND column_name = 'attempts');
SET @sql = IF(@c = 0, 'ALTER TABLE `password_reset_tokens` ADD COLUMN `attempts` int(11) NOT NULL DEFAULT 0', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'revision_number');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `revision_number` int(11) NOT NULL DEFAULT 1', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'task_completion_score');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `task_completion_score` decimal(5,2) DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'task_completion_feedback');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `task_completion_feedback` text DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'fluency_score');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `fluency_score` decimal(5,2) DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'fluency_feedback');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `fluency_feedback` text DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'pronunciation_score');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `pronunciation_score` decimal(5,2) DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'pronunciation_feedback');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `pronunciation_feedback` text DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'vocabulary_grammar_score');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `vocabulary_grammar_score` decimal(5,2) DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'speaking_student_submissions' AND column_name = 'vocabulary_grammar_feedback');
SET @sql = IF(@c = 0, 'ALTER TABLE `speaking_student_submissions` ADD COLUMN `vocabulary_grammar_feedback` text DEFAULT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `course_tests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `course_id` bigint(20) unsigned NOT NULL,
  `created_by_teacher_id` bigint(20) unsigned NOT NULL,
  `title` varchar(220) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'DRAFT',
  `current_version_no` int(10) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_test` (`course_id`),
  KEY `idx_course_test_teacher` (`created_by_teacher_id`),
  CONSTRAINT `fk_course_test_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `fk_course_test_teacher` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `grammar_attachments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `grammar_topic_id` bigint(20) unsigned NOT NULL,
  `kind` enum('FILE','LINK') NOT NULL,
  `title` varchar(200) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size_bytes` bigint(20) unsigned DEFAULT NULL,
  `sort_order` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `grammar_content_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_grammar_attachment_order` (`grammar_content_id`,`sort_order`),
  KEY `idx_grammar_attachments_topic` (`grammar_topic_id`),
  CONSTRAINT `fk_grammar_attachments_content` FOREIGN KEY (`grammar_content_id`) REFERENCES `grammar_contents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grammar_attachments_topic` FOREIGN KEY (`grammar_topic_id`) REFERENCES `grammar_topics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_activities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `course_week_id` bigint(20) unsigned NOT NULL,
  `lesson_id` bigint(20) unsigned DEFAULT NULL,
  `created_by_teacher_id` bigint(20) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `instruction` text DEFAULT NULL,
  `passage` longtext DEFAULT NULL,
  `passage_format` enum('PLAIN','MARKDOWN') NOT NULL DEFAULT 'MARKDOWN',
  `toeic_part` enum('PART_6','PART_7','GENERAL') NOT NULL DEFAULT 'PART_7',
  `passage_type` enum('SINGLE','DOUBLE','TRIPLE') NOT NULL DEFAULT 'SINGLE',
  `status` enum('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'DRAFT',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_reading_week_status` (`course_week_id`,`status`),
  KEY `idx_reading_lesson` (`lesson_id`),
  KEY `fk_reading_teacher` (`created_by_teacher_id`),
  CONSTRAINT `fk_reading_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reading_teacher` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_reading_week` FOREIGN KEY (`course_week_id`) REFERENCES `course_weeks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_attempts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reading_id` bigint(20) unsigned NOT NULL,
  `student_id` bigint(20) unsigned NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `attempt_type` varchar(30) NOT NULL DEFAULT 'ASSESSMENT',
  `practice_skill` varchar(30) DEFAULT NULL,
  `assessment_slot` int(11) DEFAULT NULL,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reading_assessment_slot` (`reading_id`,`student_id`,`assessment_slot`),
  KEY `fk_reading_attempt_student` (`student_id`),
  CONSTRAINT `fk_reading_attempt_activity` FOREIGN KEY (`reading_id`) REFERENCES `reading_activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reading_attempt_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_questions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reading_id` bigint(20) unsigned NOT NULL,
  `question_text` text NOT NULL,
  `explanation` text DEFAULT NULL,
  `evidence` text DEFAULT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 1,
  `skill_type` varchar(24) NOT NULL DEFAULT 'DETAIL',
  PRIMARY KEY (`id`),
  KEY `idx_reading_question_activity` (`reading_id`),
  CONSTRAINT `fk_reading_question_activity` FOREIGN KEY (`reading_id`) REFERENCES `reading_activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) unsigned NOT NULL,
  `option_key` varchar(10) NOT NULL,
  `option_text` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_reading_option_question` (`question_id`),
  CONSTRAINT `fk_reading_option_question` FOREIGN KEY (`question_id`) REFERENCES `reading_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_answers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `attempt_id` bigint(20) unsigned NOT NULL,
  `question_id` bigint(20) unsigned NOT NULL,
  `option_id` bigint(20) unsigned DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reading_answer` (`attempt_id`,`question_id`),
  KEY `fk_reading_answer_question` (`question_id`),
  KEY `fk_reading_answer_option` (`option_id`),
  CONSTRAINT `fk_reading_answer_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `reading_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reading_answer_option` FOREIGN KEY (`option_id`) REFERENCES `reading_options` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reading_answer_question` FOREIGN KEY (`question_id`) REFERENCES `reading_questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_attachments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reading_activity_id` bigint(20) unsigned NOT NULL,
  `kind` enum('FILE','LINK') NOT NULL DEFAULT 'FILE',
  `title` varchar(200) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size_bytes` bigint(20) unsigned DEFAULT NULL,
  `sort_order` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reading_attachment_order` (`reading_activity_id`,`sort_order`),
  CONSTRAINT `fk_reading_attachments_activity` FOREIGN KEY (`reading_activity_id`) REFERENCES `reading_activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `speaking_submission_revisions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `submission_id` bigint(20) unsigned NOT NULL,
  `revision_number` int(11) NOT NULL,
  `recording_url` varchar(1000) NOT NULL,
  `submitted_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_speaking_submission_revision` (`submission_id`,`revision_number`),
  CONSTRAINT `fk_speaking_revision_submission` FOREIGN KEY (`submission_id`) REFERENCES `speaking_student_submissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_versions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `test_id` bigint(20) unsigned NOT NULL,
  `version_no` int(10) unsigned NOT NULL,
  `status` enum('DRAFT','PUBLISHED','SUPERSEDED') NOT NULL DEFAULT 'DRAFT',
  `time_limit_minutes` int(10) unsigned NOT NULL,
  `pass_percent` decimal(5,2) NOT NULL,
  `total_points` decimal(9,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `published_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_version` (`test_id`,`version_no`),
  CONSTRAINT `fk_test_version_test` FOREIGN KEY (`test_id`) REFERENCES `course_tests` (`id`),
  CONSTRAINT `chk_test_time` CHECK (`time_limit_minutes` between 1 and 360),
  CONSTRAINT `chk_test_pass` CHECK (`pass_percent` between 0 and 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_attempts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `test_id` bigint(20) unsigned NOT NULL,
  `version_id` bigint(20) unsigned NOT NULL,
  `student_id` bigint(20) unsigned NOT NULL,
  `status` enum('IN_PROGRESS','PENDING_GRADING','GRADED') NOT NULL DEFAULT 'IN_PROGRESS',
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `auto_submitted` tinyint(1) NOT NULL DEFAULT 0,
  `earned_points` decimal(9,2) DEFAULT NULL,
  `total_points` decimal(9,2) NOT NULL,
  `passed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_student_version` (`test_id`,`student_id`,`version_id`),
  KEY `idx_test_attempt_version` (`version_id`),
  KEY `idx_test_attempt_student_date` (`student_id`,`started_at`),
  CONSTRAINT `fk_test_attempt_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_test_attempt_test` FOREIGN KEY (`test_id`) REFERENCES `course_tests` (`id`),
  CONSTRAINT `fk_test_attempt_version` FOREIGN KEY (`version_id`) REFERENCES `test_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_listening_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_by_teacher_id` bigint(20) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `instruction` text DEFAULT NULL,
  `audio_url` varchar(1000) DEFAULT NULL,
  `status` enum('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tb_listening_teacher` (`created_by_teacher_id`,`status`),
  CONSTRAINT `fk_tb_listening_teacher` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_question_sets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_by_teacher_id` bigint(20) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tb_question_set_teacher` (`created_by_teacher_id`,`status`),
  CONSTRAINT `fk_tb_question_set_teacher` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_reading_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_by_teacher_id` bigint(20) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `instruction` text DEFAULT NULL,
  `passage` longtext DEFAULT NULL,
  `passage_format` enum('PLAIN','MARKDOWN') NOT NULL DEFAULT 'MARKDOWN',
  `toeic_part` enum('PART_6','PART_7','GENERAL') NOT NULL DEFAULT 'PART_7',
  `passage_type` enum('SINGLE','DOUBLE','TRIPLE') NOT NULL DEFAULT 'SINGLE',
  `status` enum('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tb_reading_teacher` (`created_by_teacher_id`,`status`),
  CONSTRAINT `fk_tb_reading_teacher` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_speaking_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_by_teacher_id` bigint(20) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `instruction` text NOT NULL,
  `prompt_text` text DEFAULT NULL,
  `status` enum('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tb_speaking_teacher` (`created_by_teacher_id`,`status`),
  CONSTRAINT `fk_tb_speaking_teacher` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_sections` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `version_id` bigint(20) unsigned NOT NULL,
  `sort_order` int(10) unsigned NOT NULL,
  `source_type` enum('QUESTION','QUESTION_SET','LISTENING','READING','SPEAKING') NOT NULL,
  `source_question_id` bigint(20) unsigned DEFAULT NULL,
  `source_listening_id` bigint(20) unsigned DEFAULT NULL,
  `source_reading_id` bigint(20) unsigned DEFAULT NULL,
  `source_speaking_id` bigint(20) unsigned DEFAULT NULL,
  `source_test_listening_id` bigint(20) unsigned DEFAULT NULL,
  `source_test_reading_id` bigint(20) unsigned DEFAULT NULL,
  `source_test_speaking_id` bigint(20) unsigned DEFAULT NULL,
  `source_test_question_set_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `duration_minutes` int(10) unsigned NOT NULL,
  `question_count` int(10) unsigned NOT NULL,
  `max_points` decimal(9,2) NOT NULL,
  `snapshot_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`snapshot_json`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_section_order` (`version_id`,`sort_order`),
  KEY `idx_test_section_question` (`source_question_id`),
  KEY `idx_test_section_listening` (`source_listening_id`),
  KEY `idx_test_section_reading` (`source_reading_id`),
  KEY `idx_test_section_speaking` (`source_speaking_id`),
  KEY `idx_test_section_tb_listening` (`source_test_listening_id`),
  KEY `idx_test_section_tb_reading` (`source_test_reading_id`),
  KEY `idx_test_section_tb_speaking` (`source_test_speaking_id`),
  KEY `idx_test_section_tb_question_set` (`source_test_question_set_id`),
  CONSTRAINT `fk_test_section_listening` FOREIGN KEY (`source_listening_id`) REFERENCES `listening_activities` (`id`),
  CONSTRAINT `fk_test_section_question` FOREIGN KEY (`source_question_id`) REFERENCES `questions` (`id`),
  CONSTRAINT `fk_test_section_reading` FOREIGN KEY (`source_reading_id`) REFERENCES `reading_activities` (`id`),
  CONSTRAINT `fk_test_section_speaking` FOREIGN KEY (`source_speaking_id`) REFERENCES `speaking_activities` (`id`),
  CONSTRAINT `fk_test_section_tb_listening` FOREIGN KEY (`source_test_listening_id`) REFERENCES `test_bank_listening_items` (`id`),
  CONSTRAINT `fk_test_section_tb_question_set` FOREIGN KEY (`source_test_question_set_id`) REFERENCES `test_bank_question_sets` (`id`),
  CONSTRAINT `fk_test_section_tb_reading` FOREIGN KEY (`source_test_reading_id`) REFERENCES `test_bank_reading_items` (`id`),
  CONSTRAINT `fk_test_section_tb_speaking` FOREIGN KEY (`source_test_speaking_id`) REFERENCES `test_bank_speaking_items` (`id`),
  CONSTRAINT `fk_test_section_version` FOREIGN KEY (`version_id`) REFERENCES `test_versions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_test_section_source` CHECK ((`source_question_id` is not null) + (`source_listening_id` is not null) + (`source_reading_id` is not null) + (`source_speaking_id` is not null) + (`source_test_listening_id` is not null) + (`source_test_reading_id` is not null) + (`source_test_speaking_id` is not null) + (`source_test_question_set_id` is not null) = 1),
  CONSTRAINT `chk_test_section_points` CHECK (`max_points` > 0),
  CONSTRAINT `chk_test_section_duration` CHECK (`duration_minutes` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_answers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `attempt_id` bigint(20) unsigned NOT NULL,
  `section_id` bigint(20) unsigned NOT NULL,
  `question_key` varchar(40) NOT NULL,
  `selected_option_id` bigint(20) unsigned DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `saved_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_answer` (`attempt_id`,`section_id`,`question_key`),
  KEY `idx_test_answer_section` (`section_id`),
  CONSTRAINT `fk_test_answer_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `test_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_test_answer_section` FOREIGN KEY (`section_id`) REFERENCES `test_sections` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_listening_questions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) unsigned NOT NULL,
  `question_text` text NOT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tb_listening_question_item` (`item_id`),
  CONSTRAINT `fk_tb_listening_question_item` FOREIGN KEY (`item_id`) REFERENCES `test_bank_listening_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_listening_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) unsigned NOT NULL,
  `option_text` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tb_listening_option_question` (`question_id`),
  CONSTRAINT `fk_tb_listening_option_question` FOREIGN KEY (`question_id`) REFERENCES `test_bank_listening_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_question_set_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `set_id` bigint(20) unsigned NOT NULL,
  `question_id` bigint(20) unsigned NOT NULL,
  `sort_order` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tb_question_set_question` (`set_id`,`question_id`),
  UNIQUE KEY `uq_tb_question_set_order` (`set_id`,`sort_order`),
  KEY `idx_tb_question_set_item_question` (`question_id`),
  CONSTRAINT `fk_tb_question_set_item_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`),
  CONSTRAINT `fk_tb_question_set_item_set` FOREIGN KEY (`set_id`) REFERENCES `test_bank_question_sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_reading_attachments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) unsigned NOT NULL,
  `kind` enum('FILE','LINK') NOT NULL DEFAULT 'FILE',
  `title` varchar(200) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size_bytes` bigint(20) unsigned DEFAULT NULL,
  `sort_order` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tb_reading_attachment_order` (`item_id`,`sort_order`),
  CONSTRAINT `fk_tb_reading_attachment_item` FOREIGN KEY (`item_id`) REFERENCES `test_bank_reading_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_reading_questions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) unsigned NOT NULL,
  `question_text` text NOT NULL,
  `explanation` text DEFAULT NULL,
  `evidence` text DEFAULT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tb_reading_question_item` (`item_id`),
  CONSTRAINT `fk_tb_reading_question_item` FOREIGN KEY (`item_id`) REFERENCES `test_bank_reading_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_bank_reading_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) unsigned NOT NULL,
  `option_text` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tb_reading_option_question` (`question_id`),
  CONSTRAINT `fk_tb_reading_option_question` FOREIGN KEY (`question_id`) REFERENCES `test_bank_reading_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_recordings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `attempt_id` bigint(20) unsigned NOT NULL,
  `section_id` bigint(20) unsigned NOT NULL,
  `storage_url` varchar(1000) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size_bytes` bigint(20) unsigned NOT NULL,
  `saved_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_recording` (`attempt_id`,`section_id`),
  KEY `idx_test_recording_section` (`section_id`),
  CONSTRAINT `fk_test_recording_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `test_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_test_recording_section` FOREIGN KEY (`section_id`) REFERENCES `test_sections` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_section_scores` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `attempt_id` bigint(20) unsigned NOT NULL,
  `section_id` bigint(20) unsigned NOT NULL,
  `earned_points` decimal(9,2) NOT NULL,
  `max_points` decimal(9,2) NOT NULL,
  `graded_by_teacher_id` bigint(20) unsigned DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_section_score` (`attempt_id`,`section_id`),
  KEY `idx_test_section_score_section` (`section_id`),
  KEY `fk_test_score_teacher` (`graded_by_teacher_id`),
  CONSTRAINT `fk_test_score_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `test_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_test_score_section` FOREIGN KEY (`section_id`) REFERENCES `test_sections` (`id`),
  CONSTRAINT `fk_test_score_teacher` FOREIGN KEY (`graded_by_teacher_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_test_score_range` CHECK (`earned_points` >= 0 and `earned_points` <= `max_points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
