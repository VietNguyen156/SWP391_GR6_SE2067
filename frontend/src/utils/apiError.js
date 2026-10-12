// Đọc lỗi trả về từ backend thành { message, code, courseId, lessonId }.
// code: NOT_ENROLLED (chưa tham gia lớp), LESSON_LOCKED (bài bị khóa), ACCOUNT_LOCKED.

export function apiError(error, fallback) {
  const data = error?.response?.data || {};
  return {
    message: data.message || error?.message || fallback,
    code: data.code || null,
    courseId: data.courseId ?? null,
    lessonId: data.lessonId ?? null,
    status: error?.response?.status ?? null,
  };
}

/** Các nút thoát phù hợp với lý do bị chặn; `fallback` là đích mặc định ({ label, to }). */
export function accessActions(error, fallback) {
  const actions = [];
  if (error?.code === "NOT_ENROLLED" && error.courseId) {
    actions.push({ label: "Tham gia lớp", to: `/courses/${error.courseId}` });
  } else if (error?.code === "LESSON_LOCKED" && error.courseId) {
    actions.push({ label: "Về lộ trình khóa học", to: `/courses/${error.courseId}` });
  }
  if (fallback && !actions.some((action) => action.to === fallback.to)) actions.push(fallback);
  return actions;
}

/** Tiêu đề ngắn cho trạng thái lỗi. */
export function errorTitle(error) {
  if (error?.code === "NOT_ENROLLED") return "Bạn chưa tham gia lớp của khóa học";
  if (error?.code === "LESSON_LOCKED") return "Bài học chưa mở";
  if (error?.status === 404) return "Không tìm thấy nội dung";
  return "Không mở được trang này";
}
