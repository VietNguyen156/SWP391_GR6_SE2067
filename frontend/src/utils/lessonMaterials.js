// Một nguồn duy nhất cho các loại học liệu trong bài học.
// Cấu trúc: Khóa học → Tuần → Bài học → Học liệu.
// Thứ tự trong bài: Bài giảng → Ngữ pháp → Flashcards → Listening → Speaking → Quiz.

import { withReturnTo } from "./returnTo.js";

export const MATERIAL_TYPES = ["LECTURE", "GRAMMAR", "FLASHCARD", "LISTENING", "SPEAKING", "QUIZ"];
// Thư viện học liệu của giáo viên chỉ quản lý 4 loại này (bài giảng nằm trong bài, quiz ở Ngân hàng câu hỏi).
export const LIBRARY_TYPES = ["GRAMMAR", "FLASHCARD", "LISTENING", "SPEAKING"];

export const materialLabel = {
  LECTURE: "Bài giảng",
  GRAMMAR: "Ngữ pháp",
  FLASHCARD: "Flashcards",
  LISTENING: "Listening",
  SPEAKING: "Speaking",
  QUIZ: "Quiz",
};

const teacherRoute = {
  GRAMMAR: "grammar",
  FLASHCARD: "flashcards",
  LISTENING: "listening",
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

/** Đường dẫn giáo viên mở để sửa học liệu; returnTo: nơi quay về sau khi lưu/hủy. */
export function teacherMaterialLink(material, returnTo) {
  const path =
    material.type === "LECTURE"
      ? `/teacher/lessons/${material.lessonId}/edit`
      : material.type === "QUIZ"
        ? `/teacher/quizzes/${material.id}/edit`
        : `/teacher/${teacherRoute[material.type]}/${material.id}/edit`;
  return withReturnTo(path, returnTo);
}

/** Các mục "+ Thêm học liệu" của một bài học; lưu hoặc hủy thì quay về trang bài học đó. */
export function addMaterialLinks(courseId, weekId, lessonId) {
  const query = `courseId=${courseId}&weekId=${weekId}&lessonId=${lessonId}`;
  const back = teacherLessonLink(lessonId);
  return MATERIAL_TYPES.map((type) => ({
    type,
    label: materialLabel[type],
    to: withReturnTo(
      type === "LECTURE"
        ? `/teacher/lessons/${lessonId}/edit`
        : type === "QUIZ"
          ? `/teacher/quizzes/create?${query}`
          : `/teacher/${teacherRoute[type]}/new?${query}`,
      back,
    ),
  }));
}

/** Đường dẫn học viên mở học liệu. */
export function studentMaterialLink(material) {
  switch (material.type) {
    case "LECTURE":
      return `/lessons/${material.lessonId}#lecture-${material.id}`;
    case "GRAMMAR":
      return `/grammar/${material.id}`;
    case "FLASHCARD":
      return `/flashcards/${material.id}`;
    case "LISTENING":
      return `/listening/${material.id}`;
    case "SPEAKING":
      return `/speaking/${material.id}`;
    case "QUIZ":
      return `/quiz/${material.id}`;
    default:
      return `/lessons/${material.lessonId}`;
  }
}

/** Học liệu theo thứ tự chuẩn của 6 loại (giữ thứ tự gốc trong cùng loại). */
export function sortByType(materials = []) {
  return [...materials].sort(
    (a, b) => MATERIAL_TYPES.indexOf(a.type) - MATERIAL_TYPES.indexOf(b.type),
  );
}

/** Đếm học liệu theo loại, ví dụ { LECTURE: 1, QUIZ: 1 }. */
export function countByType(materials = []) {
  return materials.reduce((acc, item) => ({ ...acc, [item.type]: (acc[item.type] || 0) + 1 }), {});
}

export function weekMaterialCount(week) {
  return (week.lessons || []).reduce((sum, lesson) => sum + (lesson.materials?.length || 0), 0);
}
