import { contentStatusLabel } from "../../utils/statusLabels";

const variant = { PUBLISHED: "live", DRAFT: "draft" };

// "Đang hiển thị" là trạng thái bình thường → chấm xanh + chữ ngắn "Hiện" (tooltip giữ nhãn đầy đủ).
// Nháp / Đã ẩn vẫn hiện đủ chữ để nổi bật.
export default function StatusBadge({ status, className = "" }) {
  const label = contentStatusLabel(status);
  if (status === "PUBLISHED") {
    return (
      <span
        className={`cs-badge cs-badge-live cs-badge-dot ${className}`.trim()}
        title={label}
        aria-label={label}
      >
        Hiện
      </span>
    );
  }
  return (
    <span className={`cs-badge cs-badge-${variant[status] || "hidden"} ${className}`.trim()}>
      {label}
    </span>
  );
}
