# TOEIC Path Team Codebase

Codebase khởi đầu dành cho nhóm 5 người phát triển hệ thống học TOEIC. Dự án được thiết kế để mỗi thành viên làm trong một module riêng, dùng chung API contract và hạn chế tối đa conflict khi merge Git.

> Đây là **starter codebase**, không phải sản phẩm đã hoàn thiện. Code mẫu hiện có luồng `React -> REST API -> Spring Boot -> MySQL` cho danh sách khóa học công khai.

## 1. Công nghệ thống nhất

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Bootstrap 5, Axios |
| Backend | Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA |
| Database | MySQL 8, Flyway migrations |
| API | RESTful API, prefix `/api/v1` |
| Authentication | JWT access token và refresh token |
| Source control | GitHub, feature branch và pull request |

## 2. Cấu trúc dự án

```text
TOEIC_PATH_TEAM_CODEBASE/
├── backend/                     # Spring Boot + MySQL
│   └── src/main/java/com/toeicpath/
│       ├── auth/                # DEV 1
│       ├── user/                # DEV 1
│       ├── admin/               # DEV 2
│       ├── packageplan/         # DEV 2
│       ├── catalog/             # DEV 3
│       ├── classroom/           # DEV 4
│       ├── assessment/          # DEV 5
│       ├── progress/            # DEV 5
│       ├── common/              # Integration lead only
│       └── config/              # Integration lead only
├── frontend/src/
│   ├── app/                     # Shared router; integration lead only
│   ├── components/              # Shared UI components
│   ├── features/                # Feature-based modules
│   ├── services/                # Shared HTTP client
│   └── styles/                  # Shared design tokens
├── docs/                        # Rules, API contract, task assignment
├── scripts/                     # Windows verification scripts
└── .github/                     # Pull request template and CI
```

## 3. Yêu cầu máy

- JDK 17
- Maven 3.9+
- Node.js 20+
- MySQL 8 và MySQL Workbench
- VS Code hoặc IntelliJ IDEA
- Git

Kiểm tra:

```powershell
java -version
javac -version
mvn -version
node -v
npm -v
git --version
```

## 4. Chạy dự án lần đầu trên Windows

### Bước 1: Tạo file môi trường

Tại thư mục gốc:

```powershell
Copy-Item .env.example .env
notepad .env
```

Thay `DB_PASSWORD` bằng mật khẩu MySQL trên máy. Không commit file `.env`.

### Bước 2: Tạo database

Chạy bằng MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS toeic_learning
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Không cần chạy file schema thủ công. Flyway tự chạy `V1`, `V2` khi backend khởi động.

### Bước 3: Chạy backend

```powershell
cd backend
mvn clean spring-boot:run
```

Kiểm tra:

```text
http://localhost:8080/api/v1/health
http://localhost:8080/api/v1/public/courses
```

### Bước 4: Chạy frontend

Mở terminal mới:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Mở `http://localhost:5173`.

## 5. Phân công 5 thành viên

| Developer | Module | Branch đề nghị |
|---|---|---|
| DEV 1 | Authentication, User, Profile | `feature/dev1-auth-user` |
| DEV 2 | Admin, Tuition Package, Reports | `feature/dev2-admin-package` |
| DEV 3 | Course, Curriculum, Learning Content | `feature/dev3-course-content` |
| DEV 4 | Class, Enrollment, Schedule | `feature/dev4-classroom` |
| DEV 5 | Assessment, Practice, Progress | `feature/dev5-assessment-progress` |

Chi tiết file ownership và API nằm trong [docs/TASK_ASSIGNMENT_AND_API_CONTRACT.md](docs/TASK_ASSIGNMENT_AND_API_CONTRACT.md).

## 6. Quy trình Git ngắn gọn

Không code trực tiếp trên `main` hoặc `develop`.

```powershell
git switch develop
git pull origin develop
git switch -c feature/dev3-course-content
```

Trong quá trình làm:

```powershell
git status
git add backend/src/main/java/com/toeicpath/catalog
git add frontend/src/features/course-content
git commit -m "feat(course): add course creation"
git push -u origin feature/dev3-course-content
```

Trước khi tạo Pull Request:

```powershell
git fetch origin
git merge origin/develop
cd backend
mvn test
cd ../frontend
npm run build
```

Pull Request đi theo hướng:

```text
feature/... -> develop -> main
```

## 7. Quy tắc bắt buộc

1. Mỗi người chỉ sửa module được phân công.
2. Không tự ý sửa `pom.xml`, `package.json`, `application.yml`, `SecurityConfig.java`, `router.jsx` hoặc migration của người khác.
3. Không đổi endpoint hoặc JSON field đã chốt nếu chưa có xác nhận của nhóm.
4. Không commit `.env`, `node_modules`, `target`, file upload hoặc mật khẩu.
5. Không gọi API trực tiếp trong React page/component; API phải nằm trong `services/` của feature.
6. Controller Spring chỉ nhận/trả request; nghiệp vụ nằm trong service.
7. Không sửa migration Flyway đã merge. Luôn tạo migration mới.
8. Mọi PR phải build thành công và được ít nhất một thành viên review.

## 8. Tài liệu quan trọng

- [Project Rules](docs/PROJECT_RULES.md)
- [Task Assignment and API Contract](docs/TASK_ASSIGNMENT_AND_API_CONTRACT.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)
- [Database Conventions](docs/DATABASE_CONVENTIONS.md)
- [Design System](docs/DESIGN_SYSTEM.md)

## 9. Endpoint mẫu có sẵn

```http
GET /api/v1/health
GET /api/v1/public/courses
```

Response chuẩn:

```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```
