# ĐẶC TẢ VÀ QUY TẮC PHÁT TRIỂN TOEIC PATH

## 1. Product scope

TOEIC Path là nền tảng web quản lý khóa học TOEIC, lớp học, học liệu, bài luyện tập, bài kiểm tra và tiến độ học tập.

Các vai trò thống nhất:

- `GUEST`: xem thông tin công khai, khóa học và gói học phí.
- `STUDENT`: đăng ký, tham gia lớp, học nội dung, làm bài và xem tiến độ.
- `MENTOR`: quản lý khóa học, lớp, học liệu, bài đánh giá và phản hồi.
- `ADMIN`: quản lý tài khoản, khóa học, gói học phí, đăng ký và báo cáo.

Các trình độ thống nhất:

```text
STARTER
ELEMENTARY_A1
PRE_INTERMEDIATE_A2
INTERMEDIATE_B1
UPPER_INTERMEDIATE_B2
```

## 2. System architecture

```text
React + Vite + Bootstrap
          |
          | HTTPS / JSON REST API
          v
Spring Boot 3.5 + Spring Security + JPA
          |
          | JDBC + Flyway
          v
        MySQL 8
```

- API prefix duy nhất: `/api/v1`.
- Frontend không truy cập database.
- Controller không truy cập repository trực tiếp.
- Entity không được trả trực tiếp ra API; luôn dùng request/response DTO.
- Database schema chỉ thay đổi bằng Flyway migration.

## 3. Module ownership

| Module | Backend package | Frontend feature | Owner |
|---|---|---|---|
| Authentication/User | `auth`, `user`, `security` | `auth`, `profile` | DEV 1 |
| Admin/Package | `admin`, `packageplan` | `admin`, `packages` | DEV 2 |
| Course/Content | `catalog`, `curriculum`, `content` | `course-content`, `public-catalog` | DEV 3 |
| Classroom | `classroom`, `schedule` | `classroom` | DEV 4 |
| Assessment/Progress | `assessment`, `progress` | `assessment`, `progress` | DEV 5 |

Shared files do **not** have shared ownership. Chỉ integration lead được merge thay đổi vào:

```text
backend/pom.xml
backend/src/main/resources/application*.yml
backend/src/main/java/com/toeicpath/config/
backend/src/main/java/com/toeicpath/common/
backend/src/main/resources/db/migration/V1__baseline.sql
frontend/package.json
frontend/src/app/router.jsx
frontend/src/services/httpClient.js
frontend/src/styles/global.css
```

Nếu feature cần sửa file chung, developer ghi yêu cầu trong Pull Request; integration lead thực hiện phần sửa chung.

## 4. Backend conventions

Mỗi feature dùng cấu trúc độc lập:

```text
feature/
├── FeatureController.java
├── FeatureService.java
├── FeatureRepository.java
├── Feature.java
├── dto/
│   ├── FeatureRequest.java
│   └── FeatureResponse.java
└── FeatureMapper.java
```

Quy tắc:

- Tên class `PascalCase`; method/variable `camelCase`; constant `SCREAMING_SNAKE_CASE`.
- Constructor injection; không dùng field injection `@Autowired`.
- Controller mỏng; nghiệp vụ và transaction ở service.
- Query đọc dùng `@Transactional(readOnly = true)`.
- Query danh sách phải hỗ trợ phân trang khi dữ liệu có thể lớn.
- Kiểm tra role bằng Spring Security và `@PreAuthorize`.
- Không nhận `userId`, `mentorId` hay `adminId` từ client nếu có thể lấy từ JWT.
- Không log password, JWT, reset token hoặc dữ liệu nhạy cảm.
- Không dùng entity làm request/response body.

## 5. Frontend conventions

Mỗi feature tự quản lý component, page và service:

```text
features/course-content/
├── components/
├── pages/
├── services/
├── hooks/
└── utils/
```

Quy tắc:

- Component `PascalCase.jsx`; function/variable `camelCase`.
- API call chỉ nằm trong `features/<name>/services` hoặc `src/services`.
- Không hardcode API URL; dùng `VITE_API_BASE_URL`.
- Mỗi trang dữ liệu phải có `loading`, `error`, `empty` và `success` state.
- Không dùng `window.alert`; dùng Bootstrap alert/toast chung.
- Không đặt CSS feature vào `global.css`; tạo CSS trong feature nếu cần.
- Không tạo file `index.js` gom export toàn dự án vì dễ conflict.
- Không đổi route của module khác.

## 6. API conventions

Thành công:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Lỗi:

```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "errors": ["email: must be valid"],
  "timestamp": "2026-10-02T10:00:00Z"
}
```

HTTP status:

| Status | Usage |
|---:|---|
| 200 | Read/update success |
| 201 | Resource created |
| 204 | Delete success without response body |
| 400 | Validation or invalid request |
| 401 | Missing/invalid authentication |
| 403 | Valid login but insufficient role |
| 404 | Resource not found |
| 409 | Duplicate or business-state conflict |
| 500 | Unexpected server error |

Error code dùng `SCREAMING_SNAKE_CASE`, ví dụ:

```text
AUTH_REQUIRED
INVALID_CREDENTIALS
FORBIDDEN
RESOURCE_NOT_FOUND
VALIDATION_ERROR
DUPLICATE_EMAIL
DUPLICATE_ENROLLMENT
CLASS_CAPACITY_EXCEEDED
COURSE_NOT_PUBLISHED
ASSESSMENT_ALREADY_SUBMITTED
BUSINESS_RULE_ERROR
INTERNAL_SERVER_ERROR
```

Không dùng nội dung `message` để điều khiển logic frontend; dùng `errorCode`.

## 7. Authentication and authorization

- Password lưu bằng BCrypt; không lưu plain text.
- Access token ngắn hạn; refresh token lưu hash trong database.
- Role lấy từ server/JWT; client không được tự gửi role khi đăng ký.
- Endpoint public chỉ gồm catalog, login, register và password recovery.
- Tất cả endpoint mentor/admin phải kiểm tra role phía backend.
- Student chỉ đọc và sửa dữ liệu thuộc tài khoản của mình.
- CORS chỉ cho phép origin trong biến môi trường.

## 8. MySQL and Flyway rules

- Tên bảng/cột dùng `snake_case`, số ít cho Java entity và số nhiều cho bảng.
- Primary key dùng `BIGINT UNSIGNED AUTO_INCREMENT`.
- Thời gian lưu `DATETIME`; backend trả ISO-8601.
- Tiền VND dùng `BIGINT`, không dùng `FLOAT` hoặc `DOUBLE`.
- Email và mã nghiệp vụ phải có unique constraint tại database.
- Foreign key và index phải đặt tên rõ ràng.
- Không xóa cứng dữ liệu đã phát sinh lịch sử học tập/thanh toán.
- Không dùng `spring.jpa.hibernate.ddl-auto=update`; dùng `validate`.
- Không sửa migration đã merge hoặc đã chạy trên database chung.

Migration mới:

```text
VYYYYMMDDHHMM__devN_short_description.sql
```

Ví dụ:

```text
V202610021430__dev4_add_class_schedule.sql
```

Trước khi tạo migration, developer phải pull `develop` và kiểm tra tên migration chưa tồn tại.

## 9. Git rules chống conflict

- `main`: phiên bản ổn định/demo.
- `develop`: nhánh tích hợp của nhóm.
- `feature/*`: một feature hoặc một developer.
- Không push trực tiếp lên `main` và `develop`.
- Không commit `node_modules`, `target`, `.env`, IDE settings hoặc file upload.
- Không format toàn bộ project trong PR chỉ sửa một feature.
- Không đổi tên/move file của developer khác.
- Một commit chỉ chứa một mục đích rõ ràng.
- Pull Request nhỏ; không chờ nhiều tuần mới merge một PR lớn.
- Merge `develop` vào feature branch trước khi mở PR.
- Dùng Squash Merge để lịch sử `develop` gọn.

## 10. Testing rules

- Service có business rule phải có unit test.
- Repository query phức tạp phải có integration test.
- Frontend phải build thành công.
- Không merge PR làm hỏng endpoint health hoặc public catalog.
- Mọi bug fix cần test lại kịch bản gây lỗi.

Lệnh kiểm tra:

```powershell
cd backend
mvn test

cd ../frontend
npm run build
```

## 11. Definition of Done

Một task chỉ hoàn thành khi:

- Đúng API contract và role permission.
- Validation đầy đủ.
- Có migration nếu thay đổi database.
- Có loading/error/empty state ở frontend.
- Không chứa secret hoặc dữ liệu giả hardcode trong màn hình production.
- Backend tests thành công.
- Frontend build thành công.
- Pull Request có hướng dẫn test.
- Có ít nhất một reviewer chấp thuận.

