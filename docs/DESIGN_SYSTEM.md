# TOEIC PATH DESIGN SYSTEM

## 1. UI principles

- Giao diện rõ ràng, dễ học và không gây quá tải thông tin.
- Bootstrap 5 là UI foundation chung.
- Mobile-first cho màn hình học và làm bài.
- Dashboard desktop-first nhưng vẫn responsive.
- Mỗi màn hình dữ liệu có loading, error, empty và success state.

## 2. Colors

```text
Primary:   #285AD8
Primary light: #E6EEFF
Success:   #198754
Warning:   #FFC107
Danger:    #DC3545
Text:      #172033
Muted:     #6C757D
Background:#F7F9FC
Surface:   #FFFFFF
```

## 3. Shared components

```text
AppNavbar
AppSidebar
PageHeader
LoadingState
ErrorState
EmptyState
ConfirmModal
StatusBadge
Pagination
```

Developer không tự tạo nhiều phiên bản khác nhau của cùng một shared component. Nếu cần component chung mới, tạo PR nhỏ riêng hoặc yêu cầu integration lead.

## 4. Status colors

| Status | Bootstrap style |
|---|---|
| ACTIVE, PUBLISHED, COMPLETED | `success` |
| PENDING, PLANNED, DRAFT | `warning` or `secondary` |
| BLOCKED, CANCELLED, FAILED | `danger` |
| IN_PROGRESS | `primary` |
| ARCHIVED, INACTIVE | `secondary` |

