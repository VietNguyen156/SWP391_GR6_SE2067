# GIT WORKFLOW CHO NHÓM 5 NGƯỜI

## 1. Nhánh chuẩn

```text
main
└── develop
    ├── feature/dev1-auth-user
    ├── feature/dev2-admin-package
    ├── feature/dev3-course-content
    ├── feature/dev4-classroom
    └── feature/dev5-assessment-progress
```

`main` chỉ nhận Pull Request từ `develop`. Mỗi feature branch chỉ nhận code của một người hoặc một feature rõ ràng.

## 2. Bắt đầu task

```powershell
git switch develop
git pull origin develop
git switch -c feature/dev4-classroom
git push -u origin feature/dev4-classroom
```

Nếu branch đã tồn tại:

```powershell
git switch feature/dev4-classroom
git pull origin feature/dev4-classroom
```

## 3. Commit hằng ngày

```powershell
git status
git add backend/src/main/java/com/toeicpath/classroom
git add frontend/src/features/classroom
git commit -m "feat(classroom): add class list"
git push
```

Không dùng `git add .` một cách máy móc. Luôn xem `git status` trước khi commit.

## 4. Đồng bộ develop trước Pull Request

```powershell
git fetch origin
git merge origin/develop
```

Nếu có conflict, developer chỉ tự xử lý file thuộc ownership của mình. Conflict ở file shared phải gọi integration lead.

Sau đó:

```powershell
git add <resolved-files>
git commit
git push
```

## 5. Pull Request

- Base branch: `develop`.
- Compare branch: `feature/...`.
- Điền đầy đủ template.
- Không tự merge khi CI lỗi.
- Reviewer kiểm tra API, migration, permission và phạm vi file.
- Ưu tiên `Squash and merge`.

## 6. File dễ conflict

Các file sau do integration lead quản lý:

```text
backend/pom.xml
backend/src/main/resources/application.yml
backend/src/main/java/com/toeicpath/config/SecurityConfig.java
frontend/package.json
frontend/src/app/router.jsx
frontend/src/styles/global.css
```

Developer cần route/dependency mới thì ghi rõ trong PR:

```text
Integration request:
- Add route /teacher/courses -> CourseListPage
- Add dependency: package-name@version
```

## 7. Khi cần sửa API contract

1. Tạo issue hoặc nhắn nhóm.
2. Nêu endpoint/field cũ và mới.
3. Xác nhận ảnh hưởng FE, BE và database.
4. Cập nhật tài liệu contract trước.
5. Sau khi cả nhóm đồng ý mới sửa code.

## 8. Không được làm

- Không `git push --force` lên `main`, `develop` hoặc branch của người khác.
- Không `git reset --hard` khi chưa sao lưu thay đổi.
- Không sửa commit history của branch dùng chung.
- Không commit file `.env`.
- Không copy `node_modules` lên GitHub.
- Không xóa migration đã merge.

