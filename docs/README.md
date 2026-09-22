# Quy ước dự án TOEIC Path

## Vai trò
- STUDENT: học và làm bài.
- TEACHER: tạo khóa học, lớp, lộ trình, Chapter, Lesson, Flashcard, Quiz và Test.
- ADMIN: chỉ quản lý tài khoản, trạng thái nội dung, gói/quyền truy cập, thanh toán và báo cáo; không tạo nội dung học tập.

## Stack
- Frontend: ReactJS + Vite + Bootstrap.
- Backend: Java Spring Boot.
- Database: MySQL.
- Auth: JWT + BCrypt.

## Nguyên tắc
- Không tin role gửi từ frontend; form đăng ký public luôn tạo STUDENT.
- Mật khẩu chỉ lưu dạng BCrypt hash.
- API cần quyền phải kiểm tra JWT ở backend.
- Không commit `.env`, secret JWT, password MySQL, `node_modules`, `target`.
