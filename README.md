# TOEIC Path

Web học TOEIC trả phí cho 3 vai trò: học viên, giáo viên, quản trị.

- `backend/` — Java 17, Spring Boot 3.5, MySQL (cổng 8080)
- `frontend/` — React 19, Vite (cổng 5173)
- CSDL: MySQL, database `toeic_learning`

## Chạy dự án

1. Chuẩn bị MySQL có database `toeic_learning` (lấy bản dump từ nhóm).
2. Sao chép `.env.example` thành `.env` ở thư mục gốc và điền giá trị thật (DB, JWT, email, tài khoản nhận tiền).
3. Backend:
   ```
   cd backend
   mvn spring-boot:run
   ```
4. Frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Mở http://localhost:5173.

Backend chạy với `spring.jpa.hibernate.ddl-auto=validate`: khi đổi cấu trúc bảng phải cập nhật database trước khi chạy backend.
