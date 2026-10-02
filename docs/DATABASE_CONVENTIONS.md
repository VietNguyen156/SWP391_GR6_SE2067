# MYSQL DATABASE CONVENTIONS

## 1. Table ownership

| Owner | Tables |
|---|---|
| DEV 1 | `users`, `refresh_tokens`, `password_reset_tokens` |
| DEV 2 | `tuition_packages`, `package_purchases`, `payments`, `audit_logs` |
| DEV 3 | `courses`, `chapters`, `lessons`, `vocabulary_*`, `grammar_*`, `flashcard_*` |
| DEV 4 | `classes`, `class_enrollments`, `class_schedules` |
| DEV 5 | `quizzes`, `questions`, `attempts`, `listening_*`, `speaking_*`, `learning_progress` |

Developer không đổi cột hoặc constraint của bảng do người khác sở hữu nếu chưa có xác nhận.

## 2. Naming

```text
Table:             class_enrollments
Primary key:       id
Foreign key:       student_id
Foreign constraint: fk_enrollments_student
Unique constraint:  uk_enrollment_class_student
Index:              idx_enrollments_student_status
```

## 3. Required columns

Các bảng nghiệp vụ có thay đổi theo thời gian nên có:

```sql
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

Nếu cần xóa mềm:

```sql
deleted_at DATETIME NULL
```

## 4. Migration workflow

1. Pull `develop`.
2. Tạo file migration mới, không sửa migration cũ.
3. Dùng timestamp hiện tại và mã developer trong tên file.
4. Chạy backend trên database mới.
5. Chạy backend trên database hiện tại.
6. Ghi tên migration trong Pull Request.

Ví dụ:

```text
V202610021615__dev5_add_quiz_attempts.sql
```

## 5. Shared database warning

Mỗi developer nên có database local riêng. Không để 5 người cùng phát triển trực tiếp trên một database từ xa vì migration chưa merge có thể làm hỏng schema của nhau.

Database chung chỉ dành cho integration/demo và chỉ integration lead chạy migration.

