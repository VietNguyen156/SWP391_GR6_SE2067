// Một nguồn duy nhất cho các loại học liệu trong bài học.
// Cấu trúc: Khóa học → Tuần → Bài học → Học liệu.
// Thứ tự trong bài: Ngữ pháp → Flashcards → Listening → Reading → Speaking.

export const MATERIAL_TYPES = ["GRAMMAR", "FLASHCARD", "LISTENING", "READING", "SPEAKING"];
// Thư viện học liệu của giáo viên quản lý các loại này.
export const LIBRARY_TYPES = ["GRAMMAR", "FLASHCARD", "LISTENING", "READING", "SPEAKING"];

export const materialLabel = {
  GRAMMAR: "Ngữ pháp",
  FLASHCARD: "Flashcards",
  LISTENING: "Listening",
  READING: "Reading",
  SPEAKING: "Speaking",
};

const PART_LABEL = { PART_6: "Part 6", PART_7: "Part 7", GENERAL: "Đọc hiểu" };
const PASSAGE_LABEL = { SINGLE: "Đơn văn bản", DOUBLE: "Văn bản đôi", TRIPLE: "Ba văn bản" };

/** "Part 7 · Văn bản đôi" cho bài Reading. */
export const readingKind = (item) =>
  [PART_LABEL[item?.toeicPart], PASSAGE_LABEL[item?.passageType]].filter(Boolean).join(" · ");

/** Đoạn đường dẫn của từng loại: /teacher/<route>/:id (Xem), /:id/edit (Sửa), /new (Tạo). */
export const TEACHER_ROUTE = {
  GRAMMAR: "grammar",
  FLASHCARD: "flashcards",
  LISTENING: "listening",
  READING: "reading",
  SPEAKING: "speaking",
};

/** Trang tuần của giáo viên. */
export function teacherWeekLink(courseId, weekId) {
  return `/teacher/courses/${courseId}/weeks/${weekId}`;
}

/** Trang bài học của giáo viên (danh sách học liệu của bài). */
export function teacherLessonLink(lessonId) {
  return `/teacher/lessons/${lessonId}`;
}

/** Khóa học; có tuần thì mở thẳng trang tuần đó. */
export function teacherCourseLink(courseId, weekId) {
  return weekId ? teacherWeekLink(courseId, weekId) : `/teacher/courses/${courseId}`;
}

/**
 * Ngữ cảnh giáo viên đi vào trang Xem / Sửa học liệu, đọc từ query:
 * ?from=lesson&lessonId=<id> (từ trang bài học) hoặc ?from=library (mặc định).
 */
export function materialContext(params) {
  const lessonId = params.get("lessonId");
  return params.get("from") === "lesson" && /^\d+$/.test(lessonId || "")
    ? { from: "lesson", lessonId }
    : { from: "library" };
}

/** Query giữ ngữ cảnh khi chuyển Xem ↔ Sửa hoặc sang học liệu khác. */
export const contextQuery = (ctx) =>
  ctx?.from === "lesson" ? `from=lesson&lessonId=${ctx.lessonId}` : "from=library";

/** Trang Xem của học liệu (mặc định khi bấm vào học liệu). */
export const teacherMaterialView = (type, id, ctx) =>
  `/teacher/${TEACHER_ROUTE[type]}/${id}?${contextQuery(ctx)}`;

/** Sửa thông tin học liệu (tên, vị trí, mô tả…): mục "Sửa thông tin" trong ⋯, nút ✎. */
export const teacherMaterialEdit = (type, id, ctx) =>
  `/teacher/${TEACHER_ROUTE[type]}/${id}/edit?${contextQuery(ctx)}`;

/** Sửa nội dung học (giải thích, thẻ, câu hỏi, audio…): nút "Chỉnh sửa nội dung" ở trang Xem. */
export const teacherMaterialContent = (type, id, ctx) =>
  `/teacher/${TEACHER_ROUTE[type]}/${id}/content?${contextQuery(ctx)}`;

/** Nơi quay về khi rời học liệu (xóa xong, hủy tạo mới): trang bài học hoặc danh sách của loại. */
export function materialExitLink(type, ctx) {
  if (ctx?.from === "lesson") return teacherLessonLink(ctx.lessonId);
  return `/teacher/library?type=${type}`;
}

/** Các mục "+ Thêm học liệu" của một bài học; lưu xong mở trang Xem trong ngữ cảnh bài học. */
export function addMaterialLinks(courseId, weekId, lessonId) {
  return MATERIAL_TYPES.map((type) => ({
    type,
    label: materialLabel[type],
    to: `/teacher/${TEACHER_ROUTE[type]}/new?courseId=${courseId}&weekId=${weekId}&lessonId=${lessonId}&from=lesson`,
  }));
}

/** Đường dẫn học viên mở học liệu. */
export function studentMaterialLink(material) {
  switch (material.type) {
    case "GRAMMAR":
      return `/grammar/${material.id}`;
    case "FLASHCARD":
      return `/flashcards/${material.id}`;
    case "LISTENING":
      return `/listening/${material.id}`;
    case "READING":
      return `/reading/${material.id}`;
    case "SPEAKING":
      return `/speaking/${material.id}`;
    default:
      return `/lessons/${material.lessonId}`;
  }
}

/** Học liệu theo thứ tự chuẩn của các loại (giữ thứ tự gốc trong cùng loại). */
export function sortByType(materials = []) {
  return [...materials].sort(
    (a, b) => MATERIAL_TYPES.indexOf(a.type) - MATERIAL_TYPES.indexOf(b.type),
  );
}

/** Đếm học liệu theo loại, ví dụ { GRAMMAR: 1, READING: 1 }. */
export function countByType(materials = []) {
  return materials.reduce((acc, item) => ({ ...acc, [item.type]: (acc[item.type] || 0) + 1 }), {});
}

export function weekMaterialCount(week) {
  return (week.lessons || []).reduce((sum, lesson) => sum + (lesson.materials?.length || 0), 0);
}
