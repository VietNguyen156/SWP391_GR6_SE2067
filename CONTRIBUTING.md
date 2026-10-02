# Contributing

1. Đọc `docs/PROJECT_RULES.md` và `docs/TASK_ASSIGNMENT_AND_API_CONTRACT.md` trước khi code.
2. Nhận đúng task và branch của mình.
3. Chỉ sửa các thư mục thuộc ownership.
4. Viết migration mới cho thay đổi database; không sửa migration đã merge.
5. Cập nhật API contract trước nếu request/response cần thay đổi.
6. Chạy backend tests và frontend build trước khi tạo Pull Request.
7. Pull Request phải mô tả phạm vi, API, database migration, ảnh UI và cách test.

Commit convention:

```text
feat(auth): add student registration
fix(classroom): prevent duplicate enrollment
refactor(course): move mapping to service
test(assessment): add quiz scoring cases
docs(api): update package purchase contract
```

