# TOEIC Path

Ứng dụng học TOEIC gồm React/Vite, Spring Boot 3.5, Java 17 và MySQL 8.4.

## Chạy bằng Docker

1. Cài và mở Docker Desktop.
2. Tạo `.env` từ `.env.example` (đã có sẵn trong workspace hiện tại). Nếu tạo mới, thay `DB_PASSWORD`, `JWT_SECRET` và `RESET_CODE_SECRET` bằng giá trị ngẫu nhiên riêng.
3. Khởi động ứng dụng:

   ```powershell
   docker compose up --build
   ```

   Với volume MySQL mới, Compose nạp `toeic_learning.sql`, chạy các schema migration và thêm dữ liệu mẫu Listening/Grammar theo thứ tự. Volume hiện có được giữ nguyên; MySQL không chạy lại các script khởi tạo trên volume đó.

   Khi cập nhật một database đang có, hãy sao lưu trước rồi chạy từng migration:

   ```powershell
   docker compose cp .\backend\src\main\resources\db\manual\schema-upgrade-missing.sql mysql:/tmp/schema-upgrade-missing.sql
   docker compose exec -T mysql sh -c 'mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" -D "$MYSQL_DATABASE" < /tmp/schema-upgrade-missing.sql'
   docker compose cp .\backend\src\main\resources\db\manual\listening-grammar-depth.sql mysql:/tmp/listening-grammar-depth.sql
   docker compose exec -T mysql sh -c 'mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" -D "$MYSQL_DATABASE" < /tmp/listening-grammar-depth.sql'
   docker compose cp .\backend\src\main\resources\db\manual\listening-grammar-sample-data.sql mysql:/tmp/listening-grammar-sample-data.sql
   docker compose exec -T mysql sh -c 'mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" -D "$MYSQL_DATABASE" < /tmp/listening-grammar-sample-data.sql'
   ```

4. Mở <http://localhost:5173>. Backend API chạy trên `http://localhost:8080/api`.

Compose khởi động MySQL trước backend và frontend. Database và tệp tải lên được giữ trong Docker volumes `mysql_data` và `uploads_data`.

Đặt SMTP (`MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`) nếu muốn gửi email đặt lại mật khẩu. Có thể cấu hình tài khoản nhận tiền trong trang Cài đặt thanh toán sau khi nạp dữ liệu phù hợp.

## Nhập câu hỏi và flashcard từ file

Giảng viên có thể nhập file `.txt` hoặc Word `.docx` trong màn hình chỉnh sửa Reading, Listening,
TestBank, Flashcard và Ngân hàng câu hỏi; người học cũng có thể nhập thẻ vào bộ flashcard cá nhân.
Giao diện đọc file trong trình duyệt, hiển thị xem trước và lỗi theo dòng trước khi xác nhận.
Reading, Listening, TestBank và flashcard chỉ cập nhật form; hãy bấm **Lưu** để ghi thay đổi.
Ngân hàng câu hỏi lưu từng câu sau khi xác nhận nhập.

- Câu trắc nghiệm: bắt đầu bằng `1. Câu hỏi`, mỗi lựa chọn trên một dòng `A. ...` đến `D. ...`,
  đáp án đúng bằng `Đáp án: B` hoặc dấu `*` sau lựa chọn. `Giải thích:` và `Căn cứ:` là tùy chọn.
- Ngân hàng câu hỏi yêu cầu đủ bốn lựa chọn; các bài Reading/Listening cho phép từ hai đến bốn.
- Flashcard: mỗi dòng có dạng `mặt trước | mặt sau | phát âm | loại từ | ví dụ`; ba cột cuối có thể để trống. Có thể dán dữ liệu từ Excel dùng tab.
- File Word cần lưu dạng `.docx` và giữ mỗi câu/lựa chọn trên một đoạn riêng; `.doc` cũ chưa được hỗ trợ.
- Tải file mẫu ngay trong từng màn hình nhập. File tối đa 1 MB; dòng bắt đầu bằng `#` được xem là ghi chú.

## Chạy thủ công

- Backend: Java 17, Maven và MySQL với schema `toeic_learning`; nếu dùng MySQL từ Docker Compose, chạy `make setup` rồi `make run-backend` (MySQL được publish tại `localhost:3307`). Nếu chạy Maven trực tiếp, cấu hình `DB_URL` tới cổng MySQL đang sử dụng.
- Frontend: Node.js 22+; tại `frontend/`, chạy `npm ci` rồi `npm run dev`.

`.env` ở thư mục gốc được Spring Boot đọc tự động. Khi chạy backend trực tiếp trên máy host cùng MySQL từ Docker Compose, đặt `DB_URL` trong `.env` thành `jdbc:mysql://localhost:3307/toeic_learning?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh`.
