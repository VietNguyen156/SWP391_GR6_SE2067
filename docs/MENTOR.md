# Gói học phí và lớp học của mentor

Mentor sử dụng vai trò `TEACHER` có sẵn. Đăng ký công khai vẫn chỉ tạo `STUDENT`.

## Chuẩn bị database

- Nếu đã chạy `auth_schema.sql`, chạy tiếp `docs/database/mentor_schema.sql` trong MySQL Workbench trước khi khởi động backend mới. Script chỉ tạo bảng còn thiếu, không xóa dữ liệu.
- Nếu đã dùng toàn bộ `toeic_learning_mysql.sql`, các bảng cần thiết đã có sẵn.
- Với database đã khởi tạo bằng các script SQL, có thể đặt `JPA_DDL_AUTO=none` để Hibernate không tự thay đổi schema.
- Khởi động lại backend và frontend theo README.

Để thử với tài khoản mentor/admin, đăng ký tài khoản bình thường rồi người quản trị database gán vai trò cho đúng email:

```sql
UPDATE users SET role = 'TEACHER' WHERE email = 'mentor@example.com';
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Thay email bằng tài khoản thực tế cần cấp quyền, sau đó đăng xuất và đăng nhập lại.

## Luồng sử dụng

1. Mentor vào **Quản lý mentor → Gói học phí** (`/mentor/packages`), nhập tên, mô tả, học phí VNĐ và số ngày sử dụng. Gói mới mở đăng ký ngay.
2. Học viên vào **Gói học phí** (`/packages`), bấm **Đăng ký mua**. Hệ thống lưu đăng ký và số tiền tại thời điểm mua, trạng thái chờ xác nhận. Xem lại tại `/user/payment`.
3. Học viên liên hệ mentor/admin để nhận hướng dẫn chuyển khoản. Admin kiểm tra đã nhận tiền, vào **Xác nhận học phí** (`/admin/payments`) rồi bấm **Đã nhận tiền**. Gói bắt đầu có hiệu lực từ lúc xác nhận; ngày hết hạn tính theo thời hạn gói.
4. Mentor vào **Lớp học** (`/mentor/classes`), tạo lớp với mô tả, ngày bắt đầu/kết thúc tùy chọn và sĩ số tối đa.
5. Chọn **Quản lý học viên**, nhập email tài khoản học viên đã đăng ký để thêm vào lớp. Học viên thấy lớp tại `/user/classes`.

## Quy tắc

- Mentor chỉ xem/quản lý gói và lớp của mình; chỉ tài khoản học viên đang hoạt động được thêm vào lớp.
- Không thêm trùng, vượt sĩ số hoặc thêm vào lớp đã kết thúc/đóng. Khóa bản ghi lớp và isolation READ_COMMITTED bảo vệ việc kiểm tra sĩ số giữa các yêu cầu đồng thời.
- Không mua trùng gói đang chờ xác nhận hoặc còn hiệu lực. Gói hết hạn có thể đăng ký lại. Giá thanh toán lấy từ backend.
- Việc mua gói và thêm vào lớp là hai thao tác độc lập; mua gói chưa tự động xếp lớp.
- Mỗi lớp mới có một khóa học rỗng riêng để phù hợp quan hệ `classes.course_id` bắt buộc trong schema hiện có.
- Thanh toán được xác nhận thủ công bởi admin, chưa tích hợp cổng thanh toán hay webhook.

## Kiểm thử

- `cd backend; mvn test`: kiểm thử API qua Spring Security/JWT và database H2 riêng, không chạm dữ liệu MySQL thật.
- `cd frontend; npm run build`: build giao diện production.
- Kiểm tra thủ công trên MySQL: thực hiện luồng trên với 3 tài khoản mentor, học viên, admin; tải lại trang để xác nhận dữ liệu được lưu.
