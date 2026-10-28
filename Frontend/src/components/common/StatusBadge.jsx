import Badge from "./Badge.jsx";

const STATUS_VARIANT_MAP = {
  ACTIVE: "success",
  PUBLISHED: "success",
  COMPLETED: "success",
  SUCCESS: "success",
  DONE: "success",
  PAID: "success",
  PENDING: "accent",
  WAITING: "accent",
  PROCESSING: "accent",
  REVIEW: "accent",
  INACTIVE: "neutral",
  DRAFT: "neutral",
  CLOSED: "neutral",
  LOCKED: "neutral",
  FAILED: "danger",
  CANCELLED: "danger",
  CANCELED: "danger",
  ERROR: "danger",
};

/**
 * StatusBadge dùng chung toàn ứng dụng.
 */
export default function StatusBadge({ status, label, className = "", dot = true }) {
  const normalized = (status || "").toUpperCase();
  const variant = STATUS_VARIANT_MAP[normalized] || "neutral";
  const displayLabel = label || status;

  return (
    <Badge variant={variant} dot={dot} className={className}>
      {displayLabel}
    </Badge>
  );
}
