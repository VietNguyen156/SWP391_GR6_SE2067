// Khóa học giáo viên mở gần nhất — chỉ là tiện ích theo trình duyệt, lỗi storage thì bỏ qua.
const KEY = "teacher.lastCourseId";

export function rememberLastCourse(courseId) {
  try {
    localStorage.setItem(KEY, String(courseId));
  } catch {
    // Trình duyệt chặn storage: không nhớ được, không sao.
  }
}

export function lastCourse() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
