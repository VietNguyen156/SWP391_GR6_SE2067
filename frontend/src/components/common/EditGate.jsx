import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

/**
 * Chặn form của trang tạo/sửa cho tới khi dữ liệu sẵn sàng: đang tải → skeleton,
 * lỗi (không có quyền, không tìm thấy...) → thông báo + nút về danh sách. Không bao giờ để
 * người dùng thấy (và lưu đè) một form trống ở chế độ sửa.
 */
export default function EditGate({ edit, back, children }) {
  if (edit.status === "loading") return <LoadingState rows={2} label="Đang tải dữ liệu" />;
  if (edit.status === "error") {
    return (
      <main className="container py-5">
        <ErrorState error={edit.error} actions={back ? [back] : []} />
      </main>
    );
  }
  return children;
}

/** "Chỉnh sửa: <tên>" ở chế độ sửa để nhìn là biết đúng bản ghi đã được nạp. */
export const editTitle = (editing, name, createTitle) =>
  editing ? `Chỉnh sửa: ${name || "…"}` : createTitle;
