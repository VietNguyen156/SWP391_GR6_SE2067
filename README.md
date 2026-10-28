# TOEIC Path

Ứng dụng học TOEIC gồm React/Vite, Spring Boot 3.5, Java 17 và MySQL 8.4.

## Chạy bằng Docker

1. Cài và mở Docker Desktop.
2. Tạo `.env` từ `.env.example` (đã có sẵn trong workspace hiện tại). Nếu tạo mới, thay `DB_PASSWORD`, `JWT_SECRET` và `RESET_CODE_SECRET` bằng giá trị ngẫu nhiên riêng.
3. Lấy file dump schema/dữ liệu `toeic_learning` từ nhóm. Dự án đặt `spring.jpa.hibernate.ddl-auto=validate`, nên backend không tự tạo schema. Nạp dump vào MySQL sau khi container khởi động:

   ```powershell
   docker compose up -d mysql
   Get-Content .\path\to\toeic_learning.sql -Raw | docker compose exec -T mysql mysql -uroot -p<DB_PASSWORD> toeic_learning
   docker compose up --build
   ```

   Thay `<DB_PASSWORD>` bằng giá trị `DB_PASSWORD` trong `.env` (không gõ dấu ngoặc nhọn). Nếu file dump đã có lệnh `CREATE DATABASE`/`USE`, bỏ `toeic_learning` khỏi cuối lệnh `mysql`.

4. Mở <http://localhost:5173>. Backend API chạy trên `http://localhost:8080/api`.

Compose khởi động MySQL trước backend và frontend. Database và tệp tải lên được giữ trong Docker volumes `mysql_data` và `uploads_data`.

Đặt SMTP (`MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`) nếu muốn gửi email đặt lại mật khẩu. Có thể cấu hình tài khoản nhận tiền trong trang Cài đặt thanh toán cd fsau khi nạp dữ liệu phù hợp.

## Chạy thủ công

- Backend: Java 17, Maven và MySQL với schema `toeic_learning`; nếu dùng MySQL từ Docker Compose, chạy `make setup` rồi `make run-backend` (MySQL được publish tại `localhost:3307`). Nếu chạy Maven trực tiếp, cấu hình `DB_URL` tới cổng MySQL đang sử dụng.
- Frontend: Node.js 22+; tại `frontend/`, chạy `npm ci` rồi `npm run dev`.

`.env` ở thư mục gốc được Spring Boot đọc tự động. Khi chạy backend trực tiếp trên máy host cùng MySQL từ Docker Compose, đặt `DB_URL` trong `.env` thành `jdbc:mysql://localhost:3307/toeic_learning?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh`.
