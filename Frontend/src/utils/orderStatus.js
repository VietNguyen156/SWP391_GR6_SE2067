// Trạng thái đơn mua khóa học: nhãn, màu và bước hiển thị cho học viên/admin.

const ORDER_STATUS = {
  PENDING: { label: "Chờ chuyển khoản", tone: "warning" },
  AWAITING_CONFIRMATION: { label: "Chờ xác nhận", tone: "info" },
  PAID: { label: "Đã thanh toán", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
  CANCELLED: { label: "Đã hủy", tone: "muted" },
  EXPIRED: { label: "Hết hạn", tone: "muted" },
};

export const orderStatusLabel = (status) => ORDER_STATUS[status]?.label || status || "—";
export const orderStatusTone = (status) => ORDER_STATUS[status]?.tone || "muted";

export const PAYMENT_METHOD_LABELS = {
  BANK_TRANSFER: "Chuyển khoản",
  FREE: "Miễn phí",
  MIGRATED: "Dữ liệu cũ",
};

export const ORDER_STEPS = ["Tạo đơn", "Chuyển khoản", "Chờ xác nhận", "Hoàn tất"];

/** Chỉ số bước hiện tại (0–3) theo trạng thái; null nếu đơn đã đóng (từ chối/hủy/hết hạn). */
export function orderStep(status) {
  if (status === "PENDING") return 1;
  if (status === "AWAITING_CONFIRMATION") return 2;
  if (status === "PAID") return 3;
  return null;
}

/** Thời gian còn lại "1 ngày 02:05:09" / "02:05:09"; "" khi đã quá hạn. */
export function formatCountdown(expiresAt, now = Date.now()) {
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const pad = (n) => String(n).padStart(2, "0");
  const clock = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days ? `${days} ngày ${clock}` : clock;
}
