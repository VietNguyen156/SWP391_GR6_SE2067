import { Link } from "react-router-dom";
import { levelLabel } from "./courseFormModel";
import { formatMoney } from "../../utils/format";

/** Card khóa học cho học viên: bấm cả card để mở khóa học. */
export default function CourseCard({ course }) {
  return (
    <Link className="sc-course-card" to={`/courses/${course.id}`}>
      <span className="sc-course-cover">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <span className="sc-course-mark" aria-hidden="true">
            TP
          </span>
        )}
        <span className="sc-course-level">{levelLabel(course.level)}</span>
      </span>
      <span className="sc-course-body">
        <span className="sc-course-title">{course.title}</span>
        <span className="sc-course-meta">
          <span>{course.weekCount || 0} tuần</span>
          <span>{course.lessonCount || 0} bài</span>
          {course.targetScore ? <span>Mục tiêu {course.targetScore}</span> : null}
        </span>
        {course.price != null && (
          <span className="sc-course-price">
            {formatMoney(course.price, { freeLabel: "Miễn phí" })}
          </span>
        )}
      </span>
    </Link>
  );
}
