import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../common/Icon";
import { getLesson } from "../../services/courseService";
import { materialLabel, studentMaterialLink } from "../../utils/lessonMaterials";
import { materialPosition } from "../../utils/materialNavigation";

/**
 * Khung chung cho mọi trang học liệu của học viên.
 * - lessonId có: breadcrumb Khóa học / Tuần / Bài / học liệu, nút "Về bài học", thanh học liệu trước/sau.
 * - lessonId null (flashcard cá nhân, đề thi thử): chỉ nút quay về `fallback`.
 * Không dựa vào history.back() vì người dùng có thể vào thẳng từ link chia sẻ.
 */
export default function MaterialShell({
  lessonId,
  type,
  materialId,
  title,
  fallback,
  showPager = true,
  children,
}) {
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    let active = true;
    setLesson(null);
    if (!lessonId) return undefined;
    getLesson(lessonId)
      .then((data) => active && setLesson(data))
      .catch(() => active && setLesson(null));
    return () => {
      active = false;
    };
  }, [lessonId]);

  const lessonLink = lessonId ? `/lessons/${lessonId}` : null;
  const back = lessonLink
    ? { to: lessonLink, label: "Về bài học" }
    : fallback || { to: "/courses", label: "Khóa học" };
  const position = lesson ? materialPosition(lesson.materials, type, materialId) : null;

  return (
    <div className="ms-shell">
      <div className="ms-top">
        <div className="container ms-top-inner">
          <Link className="ms-back" to={back.to}>
            <Icon name="back" size={18} />
            <span>{back.label}</span>
          </Link>
          <nav className="ms-crumbs" aria-label="Breadcrumb">
            {lesson ? (
              <>
                <Link to={`/courses/${lesson.courseId}`}>{lesson.courseTitle}</Link>
                {lesson.courseWeekId && (
                  <>
                    <span aria-hidden="true">/</span>
                    <Link to={`/courses/${lesson.courseId}?week=${lesson.courseWeekId}`}>
                      Tuần {lesson.weekNumber}
                    </Link>
                  </>
                )}
                <span aria-hidden="true">/</span>
                <Link to={lessonLink}>Bài {lesson.sortOrder}</Link>
                <span aria-hidden="true">/</span>
              </>
            ) : (
              !lessonId &&
              fallback && (
                <>
                  <Link to={fallback.to}>{fallback.label}</Link>
                  <span aria-hidden="true">/</span>
                </>
              )
            )}
            <span aria-current="page">{title || materialLabel[type] || "Học liệu"}</span>
          </nav>
        </div>
      </div>

      {children}

      {showPager && position && (
        <nav className="container ms-pager" aria-label="Học liệu trong bài">
          {position.previous ? (
            <Link className="ms-pager-link is-prev" to={studentMaterialLink(position.previous)}>
              <Icon name="prev" size={18} />
              <span>
                <small>Học liệu trước</small>
                {position.previous.title}
              </span>
            </Link>
          ) : (
            <span className="ms-pager-link is-empty" aria-hidden="true" />
          )}
          <span
            className="ms-pager-count"
            aria-label={`Học liệu ${position.index} trên ${position.total}`}
          >
            {position.index}/{position.total}
          </span>
          {position.next ? (
            <Link className="ms-pager-link is-next" to={studentMaterialLink(position.next)}>
              <span>
                <small>Học liệu tiếp theo</small>
                {position.next.title}
              </span>
              <Icon name="next" size={18} />
            </Link>
          ) : (
            <Link className="ms-pager-link is-next is-finish" to={`${lessonLink}#complete`}>
              <span>
                <small>Đã hết học liệu</small>
                Về bài học để hoàn thành
              </span>
              <Icon name="next" size={18} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
