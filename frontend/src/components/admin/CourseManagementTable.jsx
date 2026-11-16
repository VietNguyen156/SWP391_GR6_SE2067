import { useState } from "react";
import { formatMoney } from "../../utils/format";

/** Giá bán sửa tại chỗ: bấm "Sửa", nhập số đồng, Enter để lưu, Esc để hủy. */
function PriceCell({ course, onPrice }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const value = Number(draft);
  const valid = draft !== "" && Number.isInteger(value) && value >= 0 && value <= 1_000_000_000;

  async function save() {
    if (!valid) return;
    setSaving(true);
    if (await onPrice(course, value)) setDraft(null);
    setSaving(false);
  }

  if (draft === null) {
    return (
      <div className="ac-price">
        <strong>{formatMoney(course.price, { freeLabel: "Miễn phí" })}</strong>
        <button
          type="button"
          className="btn btn-sm btn-link p-0"
          onClick={() => setDraft(String(course.price ?? 0))}
          aria-label={`Sửa giá khóa ${course.title}`}
        >
          Sửa
        </button>
      </div>
    );
  }
  return (
    <form
      className="ac-price-edit"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <input
        className={`form-control form-control-sm ${valid ? "" : "is-invalid"}`}
        type="number"
        min="0"
        step="1000"
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && setDraft(null)}
        aria-label="Giá (đồng)"
      />
      <small>{valid ? formatMoney(value, { freeLabel: "Miễn phí" }) : "Giá không hợp lệ"}</small>
      <div>
        <button type="submit" className="btn btn-sm btn-primary" disabled={!valid || saving}>
          Lưu
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={saving}
          onClick={() => setDraft(null)}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

export default function CourseManagementTable({
  courses,
  onStatus,
  onToggleActive,
  onPrice,
  busyId,
}) {
  return (
    <div className="table-responsive admin-table-wrap">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Khóa học</th>
            <th>Giáo viên</th>
            <th>Bài học</th>
            <th>Giá</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => {
            const disabled = course.status === "HIDDEN" || course.status === "ARCHIVED";
            return (
              <tr key={course.id}>
                <td>
                  <strong>{course.title}</strong>
                  <small>/{course.slug}</small>
                </td>
                <td>
                  <strong>{course.teacherName}</strong>
                  <small>{course.teacherEmail}</small>
                </td>
                <td>{course.lessonCount}</td>
                <td>
                  <PriceCell course={course} onPrice={onPrice} />
                </td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={course.status}
                    disabled={busyId === course.id}
                    onChange={(e) => onStatus(course.id, e.target.value)}
                  >
                    {course.status === "DRAFT" && (
                      <option value="DRAFT" disabled>
                        Nháp
                      </option>
                    )}
                    <option value="ACTIVE">Đang hiển thị</option>
                    <option value="HIDDEN">Đã ẩn</option>
                    <option value="ARCHIVED">Đã ẩn · lưu trữ</option>
                  </select>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${disabled ? "btn-outline-primary" : "btn-outline-warning"}`}
                    disabled={busyId === course.id}
                    onClick={() => onToggleActive(course)}
                  >
                    {disabled ? "Kích hoạt lại" : "Vô hiệu hóa"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!courses.length && <div className="content-empty m-3">Không tìm thấy khóa học.</div>}
    </div>
  );
}
