// Suy ra trạng thái lộ trình của học viên từ getStudentCurriculum(); chỉ dùng field API trả về.

const lessonStatusLabel = {
  COMPLETED: "Hoàn thành",
  IN_PROGRESS: "Đang học",
  AVAILABLE: "Có thể học",
  LOCKED: "Chưa mở",
};

export const isCompleted = (lesson) => lesson.progressStatus === "COMPLETED";
const isLocked = (lesson) => Boolean(lesson.locked) || lesson.progressStatus === "LOCKED";

/** "completed" | "locked" | "active" (đang học / có thể học). */
export function lessonState(lesson) {
  if (isCompleted(lesson)) return "completed";
  if (isLocked(lesson)) return "locked";
  return "active";
}

export function lessonLabel(lesson) {
  if (isLocked(lesson) && !isCompleted(lesson)) return lessonStatusLabel.LOCKED;
  return lessonStatusLabel[lesson.progressStatus] || lessonStatusLabel.AVAILABLE;
}

/** Danh sách phẳng { week, lesson } theo thứ tự tuần rồi đến bài. */
export function flattenLessons(weeks = []) {
  return weeks.flatMap((week) => (week.lessons || []).map((lesson) => ({ week, lesson })));
}

/** Bài đầu tiên chưa hoàn thành và không bị khóa, hoặc null. */
export function findNextLesson(weeks = []) {
  return (
    flattenLessons(weeks).find(({ lesson }) => !isCompleted(lesson) && !isLocked(lesson)) || null
  );
}

export function courseStats(weeks = []) {
  const lessons = flattenLessons(weeks).map(({ lesson }) => lesson);
  const completed = lessons.filter(isCompleted).length;
  return {
    total: lessons.length,
    completed,
    percent: lessons.length ? Math.round((completed * 100) / lessons.length) : 0,
    allDone: lessons.length > 0 && completed === lessons.length,
  };
}

/** "completed" | "current" | "locked" | "open" cho một tuần. */
export function weekState(week, nextLesson) {
  const lessons = week.lessons || [];
  if (nextLesson && lessons.some((lesson) => lesson.id === nextLesson.lesson.id)) return "current";
  if (lessons.length && lessons.every(isCompleted)) return "completed";
  if (lessons.length && lessons.every((lesson) => isLocked(lesson) && !isCompleted(lesson)))
    return "locked";
  return "open";
}

/**
 * Bài trước (bỏ qua bài bị khóa) và bài ngay sau của lessonId.
 * Bài sau vẫn được trả về khi bị khóa để giao diện hiện lý do.
 */
export function lessonNeighbours(weeks, lessonId) {
  const items = flattenLessons(weeks);
  const index = items.findIndex(({ lesson }) => String(lesson.id) === String(lessonId));
  if (index < 0) return { previous: null, next: null };
  const previous =
    items
      .slice(0, index)
      .reverse()
      .find(({ lesson }) => !isLocked(lesson) || isCompleted(lesson)) || null;
  return { previous, next: items[index + 1] || null };
}
