import { useState } from "react";
import { Link } from "react-router-dom";
import { lessonsInWeek } from "../../utils/teacherPlacement";
import { teacherWeekLink } from "../../utils/lessonMaterials";

/**
 * Vị trí của học liệu (Khóa học → Tuần → Bài). Học liệu được tạo từ bài học nên vị trí hiện
 * dạng chỉ đọc; bấm "Đổi bài" mới hiện các ô chọn. `optional` cho phép không gắn bài (Đề thi thử).
 */
export default function LessonPlacement({ courses, weeks, value, onCourse, onChange, optional }) {
  const lessons = lessonsInWeek(weeks, value.courseWeekId);
  const course = courses.find((item) => String(item.id) === String(value.courseId));
  const week = weeks.find((item) => String(item.id) === String(value.courseWeekId));
  const lesson = lessons.find((item) => String(item.id) === String(value.lessonId));
  const [changing, setChanging] = useState(!lesson);

  if (lesson && !changing) {
    return (
      <div className="lesson-placement">
        <span className="form-label d-block">Vị trí</span>
        <div className="lesson-placement-current">
          <span>
            {course?.title} · Tuần {week?.weekNumber} · Bài {lesson.sortOrder}: {lesson.title}
          </span>
          <button type="button" className="btn btn-link btn-sm" onClick={() => setChanging(true)}>
            Đổi bài
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label" htmlFor="placement-course">
          Khóa học
        </label>
        <select
          id="placement-course"
          className="form-select"
          required={!optional}
          value={value.courseId}
          onChange={(e) => onCourse(e.target.value)}
        >
          <option value="">{optional ? "Không gắn khóa học" : "Chọn khóa học"}</option>
          {courses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label" htmlFor="placement-week">
          Tuần
        </label>
        <select
          id="placement-week"
          className="form-select"
          required={!optional}
          value={value.courseWeekId}
          disabled={!value.courseId}
          onChange={(e) => onChange({ courseWeekId: e.target.value, lessonId: "" })}
        >
          <option value="">Chọn tuần</option>
          {weeks.map((item) => (
            <option key={item.id} value={item.id}>
              Tuần {item.weekNumber}: {item.title}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label" htmlFor="placement-lesson">
          Bài học
        </label>
        <select
          id="placement-lesson"
          className="form-select"
          required={!optional}
          value={value.lessonId}
          disabled={!value.courseWeekId || !lessons.length}
          onChange={(e) => onChange({ lessonId: e.target.value })}
        >
          <option value="">{optional ? "Không gắn bài (Đề thi thử)" : "Chọn bài học"}</option>
          {lessons.map((item) => (
            <option key={item.id} value={item.id}>
              Bài {item.sortOrder}: {item.title}
            </option>
          ))}
        </select>
        {value.courseWeekId && !lessons.length && (
          <small className="form-hint warning">
            Tuần này chưa có bài học.{" "}
            <Link to={teacherWeekLink(value.courseId, value.courseWeekId)}>
              Tạo bài học trước →
            </Link>
          </small>
        )}
      </div>
    </div>
  );
}
