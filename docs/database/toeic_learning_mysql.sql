
-- ============================================================
-- TOEIC LEARNING PLATFORM DATABASE
-- MySQL 8.x
-- Quy tắc nghiệp vụ:
-- 1) TEACHER tạo: gói học, khóa học, lớp học, lộ trình, chapter,
--    lesson, theory, flashcard, quiz, practice, mini/mock test.
-- 2) ADMIN chỉ quản lý/duyệt/trạng thái/thanh toán/quyền truy cập.
-- 3) STUDENT học, làm bài, lưu tiến độ, kết quả và câu sai.
-- ============================================================

CREATE DATABASE IF NOT EXISTS toeic_learning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toeic_learning;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- A. USER / AUTH
-- ============================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role ENUM('STUDENT','TEACHER','ADMIN') NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NULL,
    avatar_url VARCHAR(500) NULL,
    status ENUM('ACTIVE','LOCKED','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role_status (role, status)
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    target_toeic_score SMALLINT UNSIGNED NULL,
    estimated_current_score SMALLINT UNSIGNED NULL,
    study_goal TEXT NULL,
    preferred_study_minutes SMALLINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_profile_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE teacher_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    bio TEXT NULL,
    specialization VARCHAR(255) NULL,
    qualification VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_teacher_profile_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE email_verification_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_verify_user (user_id),
    CONSTRAINT fk_email_verify_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_user (user_id),
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- B. COURSE / CLASS / LEARNING PATH
-- ============================================================

CREATE TABLE courses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT NULL,
    target_score SMALLINT UNSIGNED NULL,
    entry_score_min SMALLINT UNSIGNED NULL,
    entry_score_max SMALLINT UNSIGNED NULL,
    thumbnail_url VARCHAR(500) NULL,
    status ENUM('DRAFT','PUBLISHED','HIDDEN','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_courses_teacher_status (created_by_teacher_id, status),
    CONSTRAINT fk_courses_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE classes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    teacher_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(180) NOT NULL,
    class_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    max_students INT UNSIGNED NULL,
    status ENUM('DRAFT','OPEN','ONGOING','COMPLETED','CLOSED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_classes_course_status (course_id, status),
    INDEX idx_classes_teacher (teacher_id),
    CONSTRAINT fk_classes_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_classes_creator
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_classes_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE class_enrollments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE','COMPLETED','DROPPED','REMOVED') NOT NULL DEFAULT 'ACTIVE',
    completed_at DATETIME NULL,
    UNIQUE KEY uq_class_student (class_id, student_id),
    INDEX idx_enrollment_student_status (student_id, status),
    CONSTRAINT fk_enrollment_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE learning_paths (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('DRAFT','PUBLISHED','HIDDEN','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_paths_course_status (course_id, status),
    CONSTRAINT fk_paths_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_paths_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE class_learning_paths (
    class_id BIGINT UNSIGNED NOT NULL,
    learning_path_id BIGINT UNSIGNED NOT NULL,
    assigned_by_teacher_id BIGINT UNSIGNED NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, learning_path_id),
    CONSTRAINT fk_class_path_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_path_path
        FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_path_teacher
        FOREIGN KEY (assigned_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE chapters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    learning_path_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_chapter_order (learning_path_id, sort_order),
    CONSTRAINT fk_chapters_path
        FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    CONSTRAINT fk_chapters_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE lessons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chapter_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    learning_objectives TEXT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    estimated_minutes SMALLINT UNSIGNED NULL,
    unlock_type ENUM('FREE','PREVIOUS_LESSON','DATE','MANUAL') NOT NULL DEFAULT 'PREVIOUS_LESSON',
    unlock_at DATETIME NULL,
    passing_score DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    status ENUM('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_lesson_order (chapter_id, sort_order),
    INDEX idx_lessons_chapter_status (chapter_id, status),
    CONSTRAINT fk_lessons_chapter
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_lessons_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- C. LESSON THEORY CONTENT
-- ============================================================

CREATE TABLE lesson_contents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lesson_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    content_type ENUM('TEXT','VIDEO','AUDIO','PDF','IMAGE','LINK') NOT NULL,
    title VARCHAR(200) NULL,
    body LONGTEXT NULL,
    resource_url VARCHAR(1000) NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_lesson_content_order (lesson_id, sort_order),
    CONSTRAINT fk_lesson_contents_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_contents_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- D. FLASHCARD
-- ============================================================

CREATE TABLE flashcard_sets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    topic VARCHAR(150) NULL,
    toeic_part ENUM('GENERAL','PART_1','PART_2','PART_3','PART_4','PART_5','PART_6','PART_7') NOT NULL DEFAULT 'GENERAL',
    difficulty ENUM('BEGINNER','EASY','MEDIUM','HARD','ADVANCED') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_flashcard_sets_teacher_status (created_by_teacher_id, status),
    CONSTRAINT fk_flashcard_sets_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE flashcards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    flashcard_set_id BIGINT UNSIGNED NOT NULL,
    front_text VARCHAR(500) NOT NULL,
    back_text TEXT NOT NULL,
    pronunciation VARCHAR(255) NULL,
    word_type VARCHAR(100) NULL,
    example_sentence TEXT NULL,
    image_url VARCHAR(1000) NULL,
    audio_url VARCHAR(1000) NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_flashcard_order (flashcard_set_id, sort_order),
    CONSTRAINT fk_flashcards_set
        FOREIGN KEY (flashcard_set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lesson_flashcard_sets (
    lesson_id BIGINT UNSIGNED NOT NULL,
    flashcard_set_id BIGINT UNSIGNED NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (lesson_id, flashcard_set_id),
    CONSTRAINT fk_lesson_flashcards_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_flashcards_set
        FOREIGN KEY (flashcard_set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- E. QUESTION BANK
-- ============================================================

CREATE TABLE question_banks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    status ENUM('ACTIVE','HIDDEN','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_banks_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_bank_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    question_type ENUM(
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'TRUE_FALSE',
        'FILL_BLANK',
        'MATCHING'
    ) NOT NULL,
    toeic_part ENUM('GENERAL','PART_1','PART_2','PART_3','PART_4','PART_5','PART_6','PART_7') NOT NULL DEFAULT 'GENERAL',
    skill ENUM('VOCABULARY','GRAMMAR','LISTENING','READING') NOT NULL,
    difficulty ENUM('BEGINNER','EASY','MEDIUM','HARD','ADVANCED') NOT NULL DEFAULT 'MEDIUM',
    topic VARCHAR(150) NULL,
    question_text LONGTEXT NOT NULL,
    passage_text LONGTEXT NULL,
    audio_url VARCHAR(1000) NULL,
    image_url VARCHAR(1000) NULL,
    explanation LONGTEXT NULL,
    default_score DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    status ENUM('ACTIVE','HIDDEN','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_questions_filter (toeic_part, skill, difficulty, status),
    CONSTRAINT fk_questions_bank
        FOREIGN KEY (question_bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
    CONSTRAINT fk_questions_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE question_options (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT UNSIGNED NOT NULL,
    option_key VARCHAR(10) NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_question_options_question
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- F. ASSESSMENT: QUIZ / PRACTICE / MINI TEST / MOCK TEST
-- ============================================================

CREATE TABLE assessments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    assessment_type ENUM('QUIZ','PRACTICE','MINI_TEST','MOCK_TEST','PLACEMENT_TEST') NOT NULL,
    title VARCHAR(220) NOT NULL,
    description TEXT NULL,
    skill ENUM('MIXED','VOCABULARY','GRAMMAR','LISTENING','READING') NOT NULL DEFAULT 'MIXED',
    time_limit_minutes SMALLINT UNSIGNED NULL,
    passing_score DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    max_attempts SMALLINT UNSIGNED NULL,
    show_answers_after_submit BOOLEAN NOT NULL DEFAULT TRUE,
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    available_from DATETIME NULL,
    available_until DATETIME NULL,
    status ENUM('DRAFT','PUBLISHED','HIDDEN','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assessments_type_status (assessment_type, status),
    CONSTRAINT fk_assessments_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE assessment_questions (
    assessment_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    score DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    PRIMARY KEY (assessment_id, question_id),
    UNIQUE KEY uq_assessment_question_order (assessment_id, sort_order),
    CONSTRAINT fk_assessment_questions_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_questions_question
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE lesson_assessments (
    lesson_id BIGINT UNSIGNED NOT NULL,
    assessment_id BIGINT UNSIGNED NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (lesson_id, assessment_id),
    CONSTRAINT fk_lesson_assessments_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_assessments_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chapter_assessments (
    chapter_id BIGINT UNSIGNED NOT NULL,
    assessment_id BIGINT UNSIGNED NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (chapter_id, assessment_id),
    CONSTRAINT fk_chapter_assessments_chapter
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_chapter_assessments_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE path_assessments (
    learning_path_id BIGINT UNSIGNED NOT NULL,
    assessment_id BIGINT UNSIGNED NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (learning_path_id, assessment_id),
    CONSTRAINT fk_path_assessments_path
        FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    CONSTRAINT fk_path_assessments_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- G. PACKAGE / SUBSCRIPTION / PAYMENT / ACCESS
-- TEACHER creates package; ADMIN manages status/payment/access.
-- ============================================================

CREATE TABLE packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(180) NOT NULL,
    description TEXT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    duration_days INT UNSIGNED NULL,
    status ENUM('DRAFT','ACTIVE','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_packages_status (status),
    CONSTRAINT fk_packages_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE package_courses (
    package_id BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (package_id, course_id),
    CONSTRAINT fk_package_courses_package
        FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_package_courses_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE features (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE package_features (
    package_id BIGINT UNSIGNED NOT NULL,
    feature_id BIGINT UNSIGNED NOT NULL,
    usage_limit INT UNSIGNED NULL,
    retain_after_expiry BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (package_id, feature_id),
    CONSTRAINT fk_package_features_package
        FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_package_features_feature
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE class_features (
    class_id BIGINT UNSIGNED NOT NULL,
    feature_id BIGINT UNSIGNED NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit INT UNSIGNED NULL,
    enabled_by_teacher_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (class_id, feature_id),
    CONSTRAINT fk_class_features_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_features_feature
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_features_teacher
        FOREIGN KEY (enabled_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NOT NULL,
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    status ENUM('PENDING','ACTIVE','EXPIRED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    activated_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_subscriptions_student_status (student_id, status),
    CONSTRAINT fk_subscriptions_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_package
        FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subscription_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('BANK_TRANSFER','QR','CASH','ONLINE_GATEWAY') NOT NULL,
    transaction_code VARCHAR(120) NULL,
    proof_url VARCHAR(1000) NULL,
    status ENUM('PENDING','PAID','REJECTED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    paid_at DATETIME NULL,
    confirmed_by_admin_id BIGINT UNSIGNED NULL,
    confirmed_at DATETIME NULL,
    note TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payments_status (status),
    CONSTRAINT fk_payments_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_admin
        FOREIGN KEY (confirmed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- H. STUDENT LEARNING PROGRESS
-- ============================================================

CREATE TABLE lesson_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    lesson_id BIGINT UNSIGNED NOT NULL,
    status ENUM('LOCKED','AVAILABLE','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'AVAILABLE',
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    last_accessed_at DATETIME NULL,
    UNIQUE KEY uq_student_lesson_progress (student_id, lesson_id),
    INDEX idx_lesson_progress_student_status (student_id, status),
    CONSTRAINT fk_lesson_progress_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_progress_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lesson_content_progress (
    student_id BIGINT UNSIGNED NOT NULL,
    lesson_content_id BIGINT UNSIGNED NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at DATETIME NULL,
    last_accessed_at DATETIME NULL,
    PRIMARY KEY (student_id, lesson_content_id),
    CONSTRAINT fk_content_progress_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_content_progress_content
        FOREIGN KEY (lesson_content_id) REFERENCES lesson_contents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE flashcard_progress (
    student_id BIGINT UNSIGNED NOT NULL,
    flashcard_id BIGINT UNSIGNED NOT NULL,
    memory_status ENUM('NEW','LEARNING','REMEMBERED','REVIEW') NOT NULL DEFAULT 'NEW',
    review_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_reviewed_at DATETIME NULL,
    next_review_at DATETIME NULL,
    PRIMARY KEY (student_id, flashcard_id),
    INDEX idx_flashcard_review (student_id, next_review_at),
    CONSTRAINT fk_flashcard_progress_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_flashcard_progress_card
        FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- I. ASSESSMENT ATTEMPTS / ANSWERS / WRONG ANSWERS
-- ============================================================

CREATE TABLE assessment_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assessment_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME NULL,
    time_spent_seconds INT UNSIGNED NULL,
    raw_score DECIMAL(10,2) NULL,
    max_score DECIMAL(10,2) NULL,
    percentage DECIMAL(5,2) NULL,
    toeic_estimated_score SMALLINT UNSIGNED NULL,
    is_passed BOOLEAN NULL,
    status ENUM('IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    UNIQUE KEY uq_student_assessment_attempt (assessment_id, student_id, attempt_no),
    INDEX idx_attempts_student_assessment (student_id, assessment_id),
    CONSTRAINT fk_attempts_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attempt_answers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    selected_option_id BIGINT UNSIGNED NULL,
    answer_text LONGTEXT NULL,
    is_correct BOOLEAN NULL,
    score_awarded DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    answered_at DATETIME NULL,
    UNIQUE KEY uq_attempt_question (attempt_id, question_id),
    CONSTRAINT fk_attempt_answers_attempt
        FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_answers_question
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_attempt_answers_option
        FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE wrong_answers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    last_attempt_id BIGINT UNSIGNED NULL,
    wrong_count INT UNSIGNED NOT NULL DEFAULT 1,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    first_wrong_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_wrong_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    UNIQUE KEY uq_wrong_answer_student_question (student_id, question_id),
    INDEX idx_wrong_answers_student_resolved (student_id, resolved),
    CONSTRAINT fk_wrong_answers_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wrong_answers_question
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_wrong_answers_attempt
        FOREIGN KEY (last_attempt_id) REFERENCES assessment_attempts(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- J. PLACEMENT TEST RESULT
-- ============================================================

CREATE TABLE placement_results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    assessment_attempt_id BIGINT UNSIGNED NOT NULL,
    listening_score SMALLINT UNSIGNED NULL,
    reading_score SMALLINT UNSIGNED NULL,
    estimated_toeic_score SMALLINT UNSIGNED NULL,
    recommended_course_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_placement_attempt (assessment_attempt_id),
    CONSTRAINT fk_placement_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_placement_attempt
        FOREIGN KEY (assessment_attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_placement_course
        FOREIGN KEY (recommended_course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- K. ANNOUNCEMENT / NOTIFICATION
-- ============================================================

CREATE TABLE class_announcements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(220) NOT NULL,
    content TEXT NOT NULL,
    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    status ENUM('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_announcements_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_announcements_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM(
        'SYSTEM',
        'CLASS',
        'ASSIGNMENT',
        'PAYMENT',
        'SUBSCRIPTION',
        'RESULT',
        'REMINDER'
    ) NOT NULL DEFAULT 'SYSTEM',
    title VARCHAR(220) NOT NULL,
    content TEXT NOT NULL,
    reference_type VARCHAR(80) NULL,
    reference_id BIGINT UNSIGNED NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_read (user_id, is_read, created_at),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- L. ADMIN MANAGEMENT / MODERATION
-- Admin does not create academic content; only changes management state.
-- ============================================================

CREATE TABLE admin_content_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT UNSIGNED NOT NULL,
    entity_type ENUM(
        'COURSE','CLASS','LEARNING_PATH','CHAPTER','LESSON',
        'FLASHCARD_SET','QUESTION_BANK','ASSESSMENT','PACKAGE'
    ) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    action_type ENUM('APPROVE','HIDE','UNHIDE','LOCK','UNLOCK','ARCHIVE','NOTE') NOT NULL,
    reason TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_actions_entity (entity_type, entity_id),
    CONSTRAINT fk_admin_actions_admin
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE admin_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(150) NOT NULL,
    target_type VARCHAR(80) NULL,
    target_id BIGINT UNSIGNED NULL,
    old_data JSON NULL,
    new_data JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_audit_admin_date (admin_id, created_at),
    CONSTRAINT fk_admin_audit_admin
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- M. OPTIONAL TEACHER ASSIGNMENT / DEADLINE
-- ============================================================

CREATE TABLE class_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT UNSIGNED NOT NULL,
    created_by_teacher_id BIGINT UNSIGNED NOT NULL,
    assignment_type ENUM('LESSON','ASSESSMENT') NOT NULL,
    lesson_id BIGINT UNSIGNED NULL,
    assessment_id BIGINT UNSIGNED NULL,
    title VARCHAR(220) NOT NULL,
    instructions TEXT NULL,
    open_at DATETIME NULL,
    due_at DATETIME NULL,
    status ENUM('DRAFT','PUBLISHED','CLOSED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignments_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_teacher
        FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- N. SEED FEATURES
-- ============================================================

INSERT INTO features (code, name, description) VALUES
('THEORY', 'Lý thuyết', 'Truy cập nội dung lý thuyết trong Lesson'),
('FLASHCARD', 'Flashcard', 'Học và ôn tập Flashcard'),
('QUIZ', 'Quiz', 'Làm Quiz theo Lesson'),
('PRACTICE', 'Bài luyện kỹ năng', 'Luyện Listening/Reading/Grammar/Vocabulary'),
('MINI_TEST', 'Mini Test', 'Bài kiểm tra ngắn theo Chapter'),
('MOCK_TEST', 'Mock Test', 'Thi thử TOEIC'),
('WRONG_BOOK', 'Sổ câu sai', 'Xem và ôn lại câu làm sai'),
('ADVANCED_ANALYTICS', 'Phân tích nâng cao', 'Phân tích điểm mạnh/yếu và lịch sử kết quả')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- ============================================================
-- O. USEFUL VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_student_active_subscriptions AS
SELECT
    s.id AS subscription_id,
    s.student_id,
    s.package_id,
    p.name AS package_name,
    s.start_at,
    s.end_at,
    s.status
FROM subscriptions s
JOIN packages p ON p.id = s.package_id
WHERE s.status = 'ACTIVE'
  AND (s.end_at IS NULL OR s.end_at >= NOW());

CREATE OR REPLACE VIEW v_student_assessment_results AS
SELECT
    a.student_id,
    a.assessment_id,
    ass.title AS assessment_title,
    ass.assessment_type,
    a.attempt_no,
    a.percentage,
    a.toeic_estimated_score,
    a.is_passed,
    a.submitted_at
FROM assessment_attempts a
JOIN assessments ass ON ass.id = a.assessment_id
WHERE a.status IN ('SUBMITTED','AUTO_SUBMITTED');

CREATE OR REPLACE VIEW v_class_student_count AS
SELECT
    c.id AS class_id,
    c.name AS class_name,
    COUNT(ce.student_id) AS active_students
FROM classes c
LEFT JOIN class_enrollments ce
       ON ce.class_id = c.id
      AND ce.status = 'ACTIVE'
GROUP BY c.id, c.name;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END OF DATABASE
-- ============================================================
