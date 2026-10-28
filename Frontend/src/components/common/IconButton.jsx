import { Link } from "react-router-dom";
import Icon from "./Icon";

/**
 * Nút chỉ có icon cho hành động lặp lại trong danh sách/bảng (sửa, xóa, sắp xếp...).
 * Luôn có aria-label và tooltip. Khi bị vô hiệu hóa, tooltip giải thích lý do
 * (bọc trong span vì nút disabled không nhận được hover).
 */
export default function IconButton({
  icon,
  label,
  onClick,
  to,
  tone = "default",
  disabled = false,
  disabledReason,
  size = 18,
}) {
  const className = `icon-btn icon-btn-${tone}`;
  const content = <Icon name={icon} size={size} />;
  if (disabled) {
    const reason = disabledReason || label;
    return (
      <span className="icon-btn-wrap" title={reason}>
        <button type="button" className={className} aria-label={`${label} — ${reason}`} disabled>
          {content}
        </button>
      </span>
    );
  }
  if (to) {
    return (
      <Link className={className} to={to} aria-label={label} title={label}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} aria-label={label} title={label}>
      {content}
    </button>
  );
}
