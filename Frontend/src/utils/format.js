// Định dạng dùng chung toàn site: ngày dd/MM/yyyy, giờ HH:mm, điểm "x/y" hoặc "%".

const pad = (value) => String(value).padStart(2, "0");

function toDate(value) {
  if (value === null || value === undefined || value === "") return null;
  // "2026-10-08" (LocalDate) được hiểu theo giờ địa phương, không lệch ngày do múi giờ.
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 08/10/2026 */
export function formatDate(value, empty = "—") {
  const date = toDate(value);
  if (!date) return empty;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** 14:05 */
export function formatTime(value, empty = "—") {
  const date = toDate(value);
  if (!date) return empty;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 14:05 08/10/2026 */
export function formatDateTime(value, empty = "—") {
  const date = toDate(value);
  if (!date) return empty;
  return `${formatTime(date)} ${formatDate(date)}`;
}

/** 75% — tối đa 1 chữ số thập phân, bỏ ".0". */
export function formatPercent(value, empty = "—") {
  if (value === null || value === undefined || value === "") return empty;
  const number = Number(value);
  if (Number.isNaN(number)) return empty;
  return `${Number(number.toFixed(1))}%`;
}

/** 7.5 — số có tối đa `digits` chữ số thập phân, bỏ số 0 thừa. */
export function formatNumber(value, digits = 1, empty = "—") {
  if (value === null || value === undefined || value === "") return empty;
  const number = Number(value);
  if (Number.isNaN(number)) return empty;
  return String(Number(number.toFixed(digits)));
}

/** Giá trị cho <input type="date">: "yyyy-MM-dd" (rỗng nếu không có). */
export function toDateInput(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Giá trị cho <input type="datetime-local">: "yyyy-MM-ddTHH:mm" (rỗng nếu không có). */
export function toDateTimeInput(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const moneyFormat = new Intl.NumberFormat("vi-VN");

/** 1.290.000 đ (0 → "Miễn phí" khi `freeLabel` được truyền). */
export function formatMoney(value, { empty = "—", freeLabel } = {}) {
  if (value === null || value === undefined || value === "") return empty;
  const number = Number(value);
  if (Number.isNaN(number)) return empty;
  if (number === 0 && freeLabel) return freeLabel;
  return `${moneyFormat.format(number)} đ`;
}
