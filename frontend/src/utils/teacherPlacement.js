import { getTeacherCourses, getTeacherCurriculum } from "../services/courseService";

async function loadCoursesWithPlacement(courseWeekId) {
  const courses = await getTeacherCourses();
  if (!courseWeekId) return { courses, courseId: "", weeks: [] };
  for (const course of courses) {
    try {
      const weeks = await getTeacherCurriculum(course.id);
      if (weeks.some((week) => String(week.id) === String(courseWeekId))) {
        return { courses, courseId: String(course.id), weeks };
      }
    } catch {}
  }
  return { courses, courseId: "", weeks: [] };
}

export function lessonsInWeek(weeks, weekId) {
  return weeks.find((week) => String(week.id) === String(weekId))?.lessons || [];
}

/**
 * Dữ liệu vị trí cho trình soạn học liệu: danh sách khóa, các tuần của khóa chứa học liệu và
 * courseId tương ứng. Tạo mới thì lấy courseId/weekId từ URL (?courseId=&weekId=&lessonId=).
 */
export async function loadPlacement(data, params) {
  const weekId = data?.courseWeekId || params.get("weekId") || "";
  const found = await loadCoursesWithPlacement(weekId);
  const courseId = found.courseId || (data ? "" : params.get("courseId") || "");
  const weeks =
    courseId && !found.weeks.length ? await getTeacherCurriculum(courseId) : found.weeks;
  return {
    courses: found.courses,
    weeks,
    placement: {
      courseId: String(courseId),
      courseWeekId: String(weekId),
      lessonId: String(data?.lessonId || params.get("lessonId") || ""),
    },
  };
}
