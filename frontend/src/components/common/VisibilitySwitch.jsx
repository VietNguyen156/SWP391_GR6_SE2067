// Công tắc Hiển thị / Ẩn dùng cho mọi nội dung. `on` / `off` là giá trị trạng thái gửi lên API.
export default function VisibilitySwitch({
  id,
  value,
  onChange,
  on = "PUBLISHED",
  off = "DRAFT",
  className = "",
  disabled = false,
}) {
  return (
    <div className={`form-check form-switch ${className}`.trim()}>
      <input
        id={id}
        className="form-check-input"
        type="checkbox"
        role="switch"
        checked={value === on}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked ? on : off)}
      />
      <label className="form-check-label" htmlFor={id}>
        Hiển thị
      </label>
    </div>
  );
}
