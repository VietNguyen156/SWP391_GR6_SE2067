# API contract — Auth cơ bản

## Public
### GET /api/health
200: `{"status":"UP","service":"elearning-backend"}`

### POST /api/auth/register
Tạo tài khoản STUDENT.
Request: `fullName`, `email`, `phone?`, `password`.
Response: JWT + user.

### POST /api/auth/login
Request: `email`, `password`.
Response: JWT + user.

### POST /api/auth/forgot-password
Request: `email`.
Demo/local response có `resetToken`; production phải gửi token qua email.

### POST /api/auth/reset-password
Request: `token`, `newPassword`.

## Protected
### GET /api/auth/me
Header: `Authorization: Bearer <jwt>`.
Response: thông tin user hiện tại.

## Role rule
Public register chỉ tạo STUDENT. TEACHER/ADMIN không được tạo bằng form đăng ký public.

## Gói học phí / lớp học

Các endpoint trả JSON, endpoint tạo mới trả 201. Request sai trả 400; sai quyền 403;
không tìm thấy 404; đăng ký trùng/lớp đầy/trạng thái không cho phép trả 409.
Lỗi nghiệp vụ có dạng `{"message":"..."}`.

| Quyền | Method | Endpoint | Nội dung |
|---|---|---|---|
| Public | GET | /api/packages | Gói ACTIVE, gồm mentorName, price, durationDays |
| TEACHER | GET | /api/mentor/packages | Gói của mentor hiện tại |
| TEACHER | POST | /api/mentor/packages | Body: name, description?, price (VNĐ, >= 0), durationDays (1–3650) |
| TEACHER | GET | /api/mentor/classes | Lớp của mentor, gồm studentCount |
| TEACHER | POST | /api/mentor/classes | Body: name, description?, startDate?, endDate? (YYYY-MM-DD), maxStudents (1–10000) |
| TEACHER | GET | /api/mentor/classes/{id}/students | Học viên trong lớp mình sở hữu |
| TEACHER | POST | /api/mentor/classes/{id}/students | Body: email; thêm tài khoản STUDENT đang ACTIVE |
| STUDENT | GET | /api/student/classes | Các lớp học viên đang tham gia |
| STUDENT | POST | /api/student/packages/{id}/purchase | Không cần body; tạo subscription + payment PENDING |
| STUDENT | GET | /api/student/subscriptions | Lịch sử đăng ký của chính học viên, số tiền và thời hạn |
| ADMIN | GET | /api/admin/payments | Yêu cầu thanh toán PENDING |
| ADMIN | POST | /api/admin/payments/{id}/confirm | Không cần body; xác nhận PAID và kích hoạt subscription |

Chi tiết quy tắc nghiệp vụ và thiết lập database: [MENTOR.md](../MENTOR.md).
