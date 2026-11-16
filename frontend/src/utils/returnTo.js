// "Quay về đúng nơi đã đi vào" cho các trang soạn thảo của giáo viên.
// Nguồn được truyền bằng query ?returnTo=<đường dẫn đã encode>; chỉ chấp nhận đường dẫn nội bộ /teacher.

export function safeReturnTo(value, fallback) {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  const internal =
    (path === "/teacher" || path.startsWith("/teacher/") || path.startsWith("/teacher?")) &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !/[\u0000-\u001f]/.test(path);
  return internal ? path : fallback;
}

/** Gắn ?returnTo= vào một đường dẫn (giữ query sẵn có). Bỏ qua nếu returnTo không hợp lệ. */
export function withReturnTo(path, returnTo) {
  const safe = safeReturnTo(returnTo, null);
  if (!safe) return path;
  return `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(safe)}`;
}

/** Nhãn ngắn cho nút quay về, suy ra từ đích đến. */
export function returnLabel(path, fallbackLabel) {
  if (path.startsWith("/teacher/courses/")) return "Về khóa học";
  if (path.startsWith("/teacher/lessons/")) return "Về bài học";
  return fallbackLabel;
}

/** Đường dẫn hiện tại (pathname + search) để làm returnTo. */
export function currentPath(location) {
  return `${location.pathname}${location.search || ""}`;
}
