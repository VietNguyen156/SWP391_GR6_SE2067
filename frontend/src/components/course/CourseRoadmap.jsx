import { Link } from "react-router-dom";
import Icon from "../common/Icon";
import { isCompleted, lessonState, weekState } from "../../utils/studentCurriculum";

const LOCK_REASON = "Hoàn thành bài trước để mở";

/**
 * Lộ trình học viên: tuần → bài, cuộn dọc. Chỉ gồm tuần/bài đang hiển thị với học viên
 * (API /student/curriculum không trả tuần, bài bị ẩn). Học liệu của bài nằm ở trang bài học.
 */
export default function CourseRoadmap({ weeks, next }) {
  return (
    <ol className="cr-weeks" aria-label="Lộ trình học">
      {weeks.map((week) => (
        <WeekBlock key={week.id} week={week} next={next} />
      ))}
    </ol>
  );
}

function WeekBlock({ week, next }) {
  const lessons = week.lessons || [];
  const done = lessons.filter(isCompleted).length;
  const label = (
    <span className="cr-week-label">
      <span className="cr-week-no">Tuần {week.weekNumber}</span>
      {week.title && week.title !== `Tuần ${week.weekNumber}` && (
        <span className="cr-week-title"> · {week.title}</span>
      )}
    </span>
  );

  // Tuần chỉ toàn bài khóa: thu gọn thành một dòng.
  if (weekState(week, next) === "locked") {
    return (
      <li className="cr-week is-locked" id={`sc-week-${week.id}`}>
        <h2 className="cr-week-head" title={LOCK_REASON}>
          {label}
          <Icon name="lock" size={15} className="cr-week-lock" />
          <span className="visually-hidden">, chưa mở</span>
        </h2>
      </li>
    );
  }

  return (
    <li className="cr-week" id={`sc-week-${week.id}`}>
      <h2 className="cr-week-head">
        {label}
        <span
          className="cr-week-count"
          aria-label={`${done} trên ${lessons.length} bài hoàn thành`}
        >
          {done}/{lessons.length}
        </span>
      </h2>
      {lessons.length ? (
        <ol className="cr-lessons">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <LessonLine lesson={lesson} isNext={next?.lesson.id === lesson.id} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="cr-empty">Tuần này chưa có bài học.</p>
      )}
    </li>
  );
}

/** Một dòng bài: ✓ đã xong / số thứ tự / 🔒, tên, thời lượng, ›. Bài khóa không bấm được. */
function LessonLine({ lesson, isNext }) {
  const state = lessonState(lesson);
  const marker =
    state === "completed" ? (
      <Icon name="check" size={14} />
    ) : state === "locked" ? (
      <Icon name="lock" size={13} />
    ) : (
      lesson.sortOrder
    );
  const body = (
    <>
      <span className="cr-mark" aria-hidden="true">
        {marker}
      </span>
      <span className="cr-title">{lesson.title}</span>
      {lesson.estimatedMinutes ? (
        <span className="cr-time">{lesson.estimatedMinutes} phút</span>
      ) : null}
      <Icon name="next" size={16} className="cr-go" />
    </>
  );

  if (state === "locked") {
    const reason = lesson.lockReason || LOCK_REASON;
    return (
      <div className="cr-lesson is-locked" aria-disabled="true" title={reason}>
        {body}
        <span className="visually-hidden">, chưa mở: {reason}</span>
      </div>
    );
  }
  return (
    <Link
      className={`cr-lesson is-${state} ${isNext ? "is-next" : ""}`}
      to={`/lessons/${lesson.id}`}
      aria-current={isNext ? "step" : undefined}
    >
      {body}
      {state === "completed" && <span className="visually-hidden">, đã hoàn thành</span>}
    </Link>
  );
}
