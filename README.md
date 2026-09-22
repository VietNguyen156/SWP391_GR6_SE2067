# TOEIC Path — React + Vite + Bootstrap + Spring Boot + MySQL

## Chức năng mentor

Đã bổ sung tạo gói học phí, học viên đăng ký mua, admin xác nhận thanh toán,
tạo lớp và thêm học viên bằng email. Xem [hướng dẫn cài đặt và sử dụng](docs/MENTOR.md).
Nếu database mới chỉ có phần auth, chạy `docs/database/mentor_schema.sql` trước khi khởi động backend.

Project đã có luồng xác thực cơ bản chạy theo REST API:

- Homepage
- Đăng ký học viên
- Đăng nhập
- JWT + BCrypt
- Lưu phiên đăng nhập frontend
- Đăng xuất
- Quên mật khẩu / đặt lại mật khẩu
- Endpoint `/api/auth/me`

## Công nghệ

- Frontend: ReactJS 19 + Vite + Bootstrap 5 + Axios + React Router
- Backend: Java 21 + Spring Boot 3.5 + Spring Security + Spring Data JPA
- Database: MySQL 8
- Authentication: JWT + BCrypt

## 1. MySQL

Cách nhanh nhất để test auth:

1. Mở MySQL Workbench.
2. Chạy `docs/database/auth_schema.sql`.

Nếu muốn dùng toàn bộ database TOEIC đã thiết kế, chạy:
`docs/database/toeic_learning_mysql.sql`.

Database mặc định: `toeic_learning`.

## 2. Backend

PowerShell:

```powershell
cd backend
$env:DB_USERNAME="root"
$env:DB_PASSWORD="MAT_KHAU_MYSQL_CUA_BAN"
$env:JWT_SECRET="mot-secret-key-rat-dai-it-nhat-32-ky-tu"
mvn spring-boot:run
```

Backend: `http://localhost:8080`
Health check: `http://localhost:8080/api/health`

Nếu MySQL root không có password, có thể bỏ biến `DB_PASSWORD`.
Không dùng secret mặc định khi deploy production.

## 3. Frontend

Mở terminal khác:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## API auth hiện có

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` — cần Bearer JWT

### Register body

```json
{
  "fullName": "Nguyen Van A",
  "email": "student@example.com",
  "phone": "0900000000",
  "password": "123456"
}
```

### Login body

```json
{
  "email": "student@example.com",
  "password": "123456"
}
```

## Quên mật khẩu

Trong bản demo/local, `/forgot-password` trả `resetToken` trực tiếp để test nhanh.
Khi deploy thật, KHÔNG trả token cho client; thay bằng gửi link/token qua email.

## Vai trò

- STUDENT: học viên. Form đăng ký public chỉ tạo STUDENT.
- TEACHER: giảng viên — sau này tạo khóa học/lớp/lộ trình/nội dung.
- ADMIN: chỉ quản lý hệ thống, không tạo nội dung học tập.

## Cấu trúc chính

- `frontend/src/pages/auth`: Login/Register/Forgot Password
- `frontend/src/pages/user/HomePage.jsx`: Homepage
- `frontend/src/contexts/AuthContext.jsx`: trạng thái đăng nhập
- `frontend/src/services`: gọi API
- `backend/src/main/java/com/elearning/auth`: nghiệp vụ auth
- `backend/src/main/java/com/elearning/security`: JWT/Spring Security
- `backend/src/main/java/com/elearning/user`: entity/repository User
- `docs/database`: SQL
  mvn spring-boot:run
  npm run dev
