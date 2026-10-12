// Dữ liệu cho Thư viện học liệu: mỗi học liệu là một dòng kèm vị trí Khóa · Tuần · Bài.
import { materialLabel } from "./lessonMaterials.js";

/** Số liệu ngắn của một học liệu, chỉ khi API có dữ liệu. */
export function materialMetric(type, detail) {
  if (!detail) return null;
  switch (type) {
    case "QUIZ":
      return detail.totalQuestion == null
        ? null
        : { icon: "quiz", text: `${detail.totalQuestion} câu` };
    case "FLASHCARD":
      return detail.cardCount == null ? null : { icon: "cards", text: `${detail.cardCount} thẻ` };
    case "LISTENING":
      return detail.attemptCount == null
        ? null
        : { icon: "headphones", text: `${detail.attemptCount} lượt làm` };
    case "SPEAKING":
      if (detail.pendingCount) return { icon: "mic", text: `${detail.pendingCount} chờ chấm` };
      return detail.submissionCount == null
        ? null
        : { icon: "mic", text: `${detail.submissionCount} bài nộp` };
    default:
      return null;
  }
}

/**
 * courses: khóa của giáo viên; curricula: { [courseId]: weeks[] } (tuần → bài → materials);
 * details: { "TYPE-id": phần tử từ API danh sách của loại đó } để lấy inUse và số liệu.
 */
export function buildRows(courses, curricula, details = {}) {
  const rows = [];
  for (const course of courses) {
    for (const week of curricula[course.id] || []) {
      for (const lesson of week.lessons || []) {
        for (const material of lesson.materials || []) {
          const key = `${material.type}-${material.id}`;
          const detail = details[key];
          rows.push({
            key,
            type: material.type,
            id: material.id,
            lessonId: lesson.id,
            title: material.title,
            status: material.status,
            courseId: course.id,
            courseTitle: course.title,
            weekId: week.id,
            weekNumber: week.weekNumber,
            weekTitle: week.title,
            lessonNo: lesson.sortOrder,
            lessonTitle: lesson.title,
            inUse: Boolean(detail?.inUse),
            metric: materialMetric(material.type, detail),
          });
        }
      }
    }
  }
  return rows;
}

/** Có `q` thì tìm trên mọi khóa (bỏ qua khóa/tuần) nhưng vẫn theo loại. */
export function filterRows(rows, { course = "all", week = "", type = "", q = "" }) {
  const needle = q.trim().toLowerCase();
  return rows.filter((row) => {
    if (type && row.type !== type) return false;
    if (needle) return row.title.toLowerCase().includes(needle);
    if (course !== "all" && String(row.courseId) !== String(course)) return false;
    return !week || String(row.weekId) === String(week);
  });
}

/** Đếm theo loại trong phạm vi khóa/tuần (hoặc từ khóa) đang lọc, không xét chip loại. */
export function countTypes(rows, filters) {
  return filterRows(rows, { ...filters, type: "" }).reduce(
    (acc, row) => ({ ...acc, [row.type]: (acc[row.type] || 0) + 1 }),
    {},
  );
}

/** Nhóm theo Khóa · Tuần, trong nhóm chia theo Bài; giữ thứ tự của chương trình học. */
export function groupRows(rows) {
  const groups = [];
  const byKey = new Map();
  for (const row of rows) {
    const key = `${row.courseId}-${row.weekId}`;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        ...pick(row, "courseId courseTitle weekId weekNumber weekTitle"),
        count: 0,
        lessons: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.count++;
    let lesson = group.lessons[group.lessons.length - 1];
    if (!lesson || lesson.lessonId !== row.lessonId) {
      lesson = { ...pick(row, "lessonId lessonNo lessonTitle"), items: [] };
      group.lessons.push(lesson);
    }
    lesson.items.push(row);
  }
  return groups;
}

/**
 * Tên hiển thị trong thư viện: nếu tên học liệu chỉ lặp lại tên bài ("Đảo ngữ…" hoặc
 * "Đảo ngữ… – bản 2") thì hiện tên loại ("Ngữ pháp") vì tên bài đã có ở mốc bài phía trên.
 */
export function displayTitle(row) {
  const title = (row.title || "").trim();
  const lesson = (row.lessonTitle || "").trim();
  if (!lesson) return title;
  const head = title.slice(0, lesson.length).toLowerCase();
  const rest = title.slice(lesson.length);
  if (head === lesson.toLowerCase() && (!rest.trim() || /^\s*[–—:-]/.test(rest)))
    return materialLabel[row.type] || title;
  return title;
}

/** Tách chuỗi để tô đậm phần khớp từ khóa (không phân biệt hoa thường). */
export function splitMatch(text, q) {
  const needle = q.trim().toLowerCase();
  const at = needle ? text.toLowerCase().indexOf(needle) : -1;
  if (at < 0) return [{ text, match: false }];
  return [
    { text: text.slice(0, at), match: false },
    { text: text.slice(at, at + needle.length), match: true },
    { text: text.slice(at + needle.length), match: false },
  ].filter((part) => part.text);
}

const pick = (row, keys) => Object.fromEntries(keys.split(" ").map((k) => [k, row[k]]));
