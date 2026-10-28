import { Link } from "react-router-dom";

/**
 * Chế độ của trang soạn: "info" (Sửa thông tin), "content" (Sửa nội dung), "all" (tạo mới: cả hai).
 */
export const editorTitle = (mode, name, createTitle) =>
  mode === "info"
    ? `Sửa thông tin: ${name || "…"}`
    : mode === "content"
      ? `Sửa nội dung: ${name || "…"}`
      : createTitle;

/** Đầu trang Sửa / Tạo học liệu: link quay lại trang Xem (hoặc nơi đi vào) và tiêu đề. */
export function EditHeader({ title, back }) {
  return (
    <header className="mv-edit-head">
      <Link className="mv-back" to={back.to}>
        ← {back.label}
      </Link>
      <h1>{title}</h1>
    </header>
  );
}

/**
 * Thanh Lưu / Hủy dính đáy trang. Nút Lưu gửi form theo `formId` nên thanh có thể đặt ở cuối trang,
 * ngoài thẻ form. Hủy là link thường nên đi qua useUnsavedGuard (hỏi khi còn thay đổi chưa lưu).
 */
export function SaveBar({ formId, cancelTo, saving, disabled, label = "Lưu" }) {
  return (
    <div className="mv-savebar">
      <Link className="btn btn-outline-secondary" to={cancelTo}>
        Hủy
      </Link>
      <button type="submit" form={formId} className="btn btn-primary" disabled={saving || disabled}>
        {saving ? "Đang lưu…" : label}
      </button>
    </div>
  );
}

/** Thanh đáy khi mọi thay đổi đã tự lưu từng phần (nội dung Ngữ pháp): chỉ có nút Xong. */
export function DoneBar({ to }) {
  return (
    <div className="mv-savebar">
      <Link className="btn btn-primary" to={to}>
        Xong
      </Link>
    </div>
  );
}
