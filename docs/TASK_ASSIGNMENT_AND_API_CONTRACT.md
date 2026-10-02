# PHÂN CÔNG 5 THÀNH VIÊN VÀ API CONTRACT

## 1. Mục tiêu

Tài liệu này khóa phạm vi của 5 developer. Mỗi người có backend package, frontend feature, database tables và API riêng. Khi một API đã được chốt trong tài liệu này, không đổi URL, method hoặc field nếu chưa được cả nhóm xác nhận.

Mọi API dùng prefix:

```text
/api/v1
```

## 2. Bảng phân công tổng hợp

| Developer | Backend | Frontend | Database | Branch |
|---|---|---|---|---|
| DEV 1 | Auth, User, Security | Auth, Profile | User/token tables | `feature/dev1-auth-user` |
| DEV 2 | Admin, Package, Payment, Report | Admin, Package | Package/payment/audit tables | `feature/dev2-admin-package` |
| DEV 3 | Course, Curriculum, Content | Course Content, Public Catalog | Course/content tables | `feature/dev3-course-content` |
| DEV 4 | Class, Enrollment, Schedule | Classroom | Class/enrollment tables | `feature/dev4-classroom` |
| DEV 5 | Assessment, Practice, Progress | Assessment, Progress | Assessment/progress tables | `feature/dev5-assessment-progress` |

Thay `DEV 1`...`DEV 5` bằng tên thành viên trước khi bắt đầu sprint.

---

## 3. DEV 1 — Authentication, User and Profile

### Ownership

```text
backend/src/main/java/com/toeicpath/auth/
backend/src/main/java/com/toeicpath/user/
backend/src/main/java/com/toeicpath/security/
frontend/src/features/auth/
frontend/src/features/profile/
```

### Database

```text
users
refresh_tokens
password_reset_tokens
```

### Features

- Student registration.
- Login and logout.
- JWT access/refresh token.
- Current-user information.
- Password change and password recovery.
- Student and mentor profile.
- Role guards for `STUDENT`, `MENTOR`, `ADMIN`.

### API

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
GET  /api/v1/users/me
PUT  /api/v1/users/me
PUT  /api/v1/users/me/password
```

Register request:

```json
{
  "email": "student@example.com",
  "password": "Password123!",
  "fullName": "Nguyen Van A",
  "phone": "0912345678"
}
```

Login response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": 10,
      "email": "student@example.com",
      "fullName": "Nguyen Van A",
      "role": "STUDENT",
      "status": "ACTIVE"
    }
  }
}
```

### Shared handoff

DEV 1 bàn giao cho nhóm:

- JWT authentication filter.
- Current-user helper.
- Role authorization examples.
- Login response contract.
- Axios access-token integration request cho integration lead.

---

## 4. DEV 2 — Administration, Tuition Packages and Reports

### Ownership

```text
backend/src/main/java/com/toeicpath/admin/
backend/src/main/java/com/toeicpath/packageplan/
frontend/src/features/admin/
frontend/src/features/packages/
```

### Database

```text
tuition_packages
package_purchases
payments
audit_logs
```

### Features

- Admin dashboard.
- User list and account status.
- Mentor approval.
- Tuition package CRUD.
- Package purchase status.
- Course status moderation.
- Platform reports.

### API

```http
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users
GET    /api/v1/admin/users/{userId}
PATCH  /api/v1/admin/users/{userId}/status
GET    /api/v1/admin/mentor-requests
PATCH  /api/v1/admin/mentor-requests/{requestId}

GET    /api/v1/admin/packages
POST   /api/v1/admin/packages
GET    /api/v1/admin/packages/{packageId}
PUT    /api/v1/admin/packages/{packageId}
PATCH  /api/v1/admin/packages/{packageId}/status

POST   /api/v1/student/package-purchases
GET    /api/v1/student/package-purchases
GET    /api/v1/admin/package-purchases
PATCH  /api/v1/admin/package-purchases/{purchaseId}/status

GET    /api/v1/admin/reports
```

Package request:

```json
{
  "code": "TOEIC-600-90",
  "name": "TOEIC 600+ Package",
  "description": "Ninety-day TOEIC learning package",
  "priceVnd": 1499000,
  "durationDays": 90
}
```

Status values:

```text
User:     ACTIVE, INACTIVE, BLOCKED
Package:  ACTIVE, INACTIVE
Purchase: PENDING, PAID, CANCELLED, EXPIRED
```

---

## 5. DEV 3 — Course, Curriculum and Learning Content

### Ownership

```text
backend/src/main/java/com/toeicpath/catalog/
backend/src/main/java/com/toeicpath/curriculum/
backend/src/main/java/com/toeicpath/content/
frontend/src/features/public-catalog/
frontend/src/features/course-content/
```

### Database

```text
courses
chapters
lessons
vocabulary_topics
vocabulary_words
grammar_topics
grammar_contents
flashcard_sets
flashcards
```

### Features

- Public course catalog for Guest.
- Mentor course CRUD.
- Course level and publication status.
- Chapter and lesson structure.
- Vocabulary and grammar content.
- Flashcard content.
- Lesson ordering.

### API

```http
GET    /api/v1/public/courses
GET    /api/v1/public/courses/{courseId}

GET    /api/v1/mentor/courses
POST   /api/v1/mentor/courses
GET    /api/v1/mentor/courses/{courseId}
PUT    /api/v1/mentor/courses/{courseId}
PATCH  /api/v1/mentor/courses/{courseId}/status

GET    /api/v1/mentor/courses/{courseId}/chapters
POST   /api/v1/mentor/courses/{courseId}/chapters
PUT    /api/v1/mentor/chapters/{chapterId}
DELETE /api/v1/mentor/chapters/{chapterId}

POST   /api/v1/mentor/chapters/{chapterId}/lessons
PUT    /api/v1/mentor/lessons/{lessonId}
DELETE /api/v1/mentor/lessons/{lessonId}

GET    /api/v1/student/courses/{courseId}/content
GET    /api/v1/student/lessons/{lessonId}
```

Course request:

```json
{
  "code": "TOEIC-600",
  "title": "TOEIC 600+ Roadmap",
  "description": "Structured preparation for a 600+ target",
  "level": "INTERMEDIATE_B1",
  "priceVnd": 1499000,
  "packageId": 2
}
```

Course status:

```text
DRAFT -> PUBLISHED -> ARCHIVED
```

---

## 6. DEV 4 — Classroom, Enrollment and Schedule

### Ownership

```text
backend/src/main/java/com/toeicpath/classroom/
backend/src/main/java/com/toeicpath/schedule/
frontend/src/features/classroom/
```

### Database

```text
classes
class_enrollments
class_schedules
```

### Features

- Mentor class CRUD.
- Class level, capacity and date range.
- Student roster.
- Student class enrollment.
- Admin manual enrollment.
- Class schedule.
- Student class list and class details.
- Duplicate enrollment and capacity rules.

### API

```http
GET    /api/v1/mentor/classes
POST   /api/v1/mentor/classes
GET    /api/v1/mentor/classes/{classId}
PUT    /api/v1/mentor/classes/{classId}
DELETE /api/v1/mentor/classes/{classId}
GET    /api/v1/mentor/classes/{classId}/students

POST   /api/v1/classes/{classId}/join
DELETE /api/v1/student/classes/{classId}/leave
GET    /api/v1/student/classes
GET    /api/v1/student/classes/{classId}

POST   /api/v1/admin/classes/{classId}/enrollments
DELETE /api/v1/admin/classes/{classId}/enrollments/{studentId}

GET    /api/v1/mentor/classes/{classId}/schedules
POST   /api/v1/mentor/classes/{classId}/schedules
PUT    /api/v1/mentor/schedules/{scheduleId}
DELETE /api/v1/mentor/schedules/{scheduleId}
```

Class request:

```json
{
  "courseId": 2,
  "classCode": "TOEIC600-A01",
  "name": "TOEIC 600 Evening Class",
  "level": "INTERMEDIATE_B1",
  "capacity": 30,
  "startDate": "2026-10-15",
  "endDate": "2027-01-15"
}
```

Business rules:

- Student cannot have two active enrollments in the same class.
- Student cannot join a full, closed, cancelled, or completed class.
- Mentor can update only classes assigned to that mentor.
- Enrollment must reference a user with role `STUDENT`.

---

## 7. DEV 5 — Assessment, Practice and Progress

### Ownership

```text
backend/src/main/java/com/toeicpath/assessment/
backend/src/main/java/com/toeicpath/progress/
frontend/src/features/assessment/
frontend/src/features/progress/
```

### Database

```text
quizzes
questions
question_options
quiz_attempts
quiz_answers
listening_activities
listening_questions
speaking_activities
speaking_submissions
lesson_progress
course_progress
```

### Features

- Mentor quiz and question management.
- Student quiz attempts and results.
- Listening activities and answers.
- Speaking recordings and mentor feedback.
- Lesson completion.
- Course and class progress.
- Student dashboard and result history.

### API

```http
GET    /api/v1/mentor/quizzes
POST   /api/v1/mentor/quizzes
PUT    /api/v1/mentor/quizzes/{quizId}
DELETE /api/v1/mentor/quizzes/{quizId}
POST   /api/v1/mentor/quizzes/{quizId}/questions
PUT    /api/v1/mentor/questions/{questionId}
DELETE /api/v1/mentor/questions/{questionId}

GET    /api/v1/student/quizzes
GET    /api/v1/student/quizzes/{quizId}
POST   /api/v1/student/quizzes/{quizId}/attempts
POST   /api/v1/student/attempts/{attemptId}/answers
POST   /api/v1/student/attempts/{attemptId}/submit
GET    /api/v1/student/results

GET    /api/v1/student/listening
POST   /api/v1/student/listening/{activityId}/attempts
GET    /api/v1/student/speaking
POST   /api/v1/student/speaking/{activityId}/submissions
PATCH  /api/v1/mentor/speaking-submissions/{submissionId}/grade

PUT    /api/v1/student/lessons/{lessonId}/progress
GET    /api/v1/student/progress
GET    /api/v1/mentor/classes/{classId}/progress
```

Quiz submit response:

```json
{
  "success": true,
  "message": "Quiz submitted",
  "data": {
    "attemptId": 25,
    "correctAnswers": 18,
    "totalQuestions": 25,
    "score": 72,
    "status": "COMPLETED"
  }
}
```

Business rules:

- Server calculates scores; frontend does not send final score.
- Submitted attempts are immutable.
- Speaking score must be within the configured score range.
- Students can access activities only through eligible courses/classes.

---

## 8. Common API contract

### Authentication header

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

### List response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

### Validation error

```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "errors": ["email: must be valid"],
  "timestamp": "2026-10-02T10:00:00Z"
}
```

## 9. Dependency order

```text
DEV 1: Auth + User + Security
   |
   +--> DEV 2: Admin permissions and package purchases
   +--> DEV 3: Mentor ownership and student content access
   +--> DEV 4: Mentor/student enrollment permissions
   +--> DEV 5: Student attempts and mentor grading

DEV 3 Course IDs --> DEV 4 Classes --> DEV 5 Class progress
DEV 2 Package eligibility --> DEV 4 Enrollment
DEV 3 Lessons --> DEV 5 Assessment and progress
```

Khi dependency chưa merge, developer dùng mock response hoặc interface theo đúng API contract. Không tự tạo một phiên bản auth/course/class khác trong module của mình.

## 10. Integration lead responsibilities

- Quản lý shared configuration và shared dependencies.
- Thêm route mới vào `frontend/src/app/router.jsx` sau khi feature merge.
- Review migration có foreign key giữa hai module.
- Merge Pull Request vào `develop` theo dependency order.
- Chạy smoke test sau mỗi lần merge.
- Chuẩn bị release từ `develop` sang `main`.

## 11. Checklist trước Pull Request

- [ ] Chỉ sửa file thuộc module được giao.
- [ ] Endpoint đúng `/api/v1` và đúng contract.
- [ ] Có DTO và validation.
- [ ] Controller không chứa business logic.
- [ ] Role permission được kiểm tra ở backend.
- [ ] Migration mới có tên duy nhất.
- [ ] Không sửa migration đã merge.
- [ ] Frontend có loading/error/empty state.
- [ ] Không có secret, `.env`, `node_modules`, `target`.
- [ ] `mvn test` thành công.
- [ ] `npm run build` thành công.
- [ ] Pull Request có hướng dẫn test và ảnh UI nếu có.

## 12. Sprint khởi động đề nghị

| Day | Team activity |
|---|---|
| Day 1 | Clone, run starter, confirm environment and ownership |
| Day 2 | DEV 1 auth foundation; other developers build UI with API mocks |
| Day 3–4 | Database migrations and module APIs |
| Day 5 | First module integration into `develop` |
| Day 6–7 | Connect frontend to real APIs |
| Day 8 | Cross-module integration and permission checks |
| Day 9 | Testing and bug fixing |
| Day 10 | Demo build and release to `main` |

