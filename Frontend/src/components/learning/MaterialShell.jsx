import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Icon from "../common/Icon";
import { getLesson } from "../../services/courseService";
import { materialLabel, studentMaterialLink } from "../../utils/lessonMaterials";
import { materialPosition } from "../../utils/materialNavigation";

/**
 * Khung chế độ học chung cho mọi trang học liệu của học viên.
 * - Thanh trên: Nút ← Về bài học, breadcrumb rút gọn, tiến độ học liệu x/y, nút "Chế độ tập trung" (F).
 * - Thanh dưới dính đáy: ‹ Học liệu trước · vị trí x/y · Học liệu tiếp theo / Hoàn thành bài ✓.
 * - Chữ để đọc chuẩn giáo trình học thuật.
 */
export default function MaterialShell({
  lessonId,
  type,
  materialId,
  title,
  fallback,
  showPager = true,
  exam = false,
  compact = false,
  hideCompactTitle = false,
  children,
}) {
  const [lesson, setLesson] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

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

  // Phím tắt F bật / tắt chế độ tập trung
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "f" || e.key === "F") {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
          return;
        }
        setFocusMode((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("is-focus-mode");
    } else {
      document.body.classList.remove("is-focus-mode");
    }
    return () => {
      document.body.classList.remove("is-focus-mode");
    };
  }, [focusMode]);

  const lessonLink = lessonId ? `/lessons/${lessonId}` : null;
  const back = lessonLink
    ? { to: lessonLink, label: "Về bài học" }
    : fallback || { to: "/courses", label: "Khóa học" };
  const position = lesson ? materialPosition(lesson.materials, type, materialId) : null;

  const requirements = lesson?.completionRequirements || [];
  const missing = requirements.filter((item) => !item.done);
  const isCompleted = lesson?.progressStatus === "COMPLETED";
  const canComplete = isCompleted || missing.length === 0;

  return (
    <div
      className={`ms-shell ${focusMode ? "ms-shell-focus" : ""}${exam ? " ms-shell-exam" : ""}${compact ? " ms-shell-compact" : ""}`}
    >
      {!exam && (
        <div className="ms-top">
          {compact ? (
            <div className="container ms-top-inner">
              <Link className="ms-back" to={back.to} aria-label={back.label}>
                <Icon name="back" size={16} />
                <span>{back.label}</span>
              </Link>
              {!hideCompactTitle && (
                <strong className="ms-compact-title">
                  {title || materialLabel[type] || "Học liệu"}
                </strong>
              )}
            </div>
          ) : (
            <div className="container ms-top-inner">
              <div className="ms-top-left">
                <Link className="ms-back" to={back.to}>
                  <Icon name="back" size={16} />
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

              <div className="ms-top-right">
                {position && (
                  <div
                    className="ms-progress-badge"
                    title={`Đã làm ${position.index} trên ${position.total} học liệu`}
                  >
                    <span className="ms-progress-text">
                      Tiến độ:{" "}
                      <strong>
                        {position.index}/{position.total}
                      </strong>
                    </span>
                    <div className="ms-progress-mini-bar" aria-hidden="true">
                      <div
                        className="ms-progress-mini-fill"
                        style={{ width: `${(position.index / position.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className={`ms-focus-btn ${focusMode ? "is-active" : ""}`}
                  onClick={() => setFocusMode((v) => !v)}
                  title={focusMode ? "Thoát chế độ tập trung (F)" : "Bật chế độ tập trung (F)"}
                  aria-label={focusMode ? "Thoát chế độ tập trung (F)" : "Bật chế độ tập trung (F)"}
                >
                  <Icon name="focus" size={16} />
                  <span className="ms-focus-label">
                    {focusMode ? "Thoát tập trung" : "Tập trung"}
                  </span>
                  <kbd className="ms-focus-kbd">F</kbd>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="ms-content-reading-wrap">{children}</div>
      {showPager && position && (
        <motion.footer
          className="ms-bottom-bar"
          aria-label="Điều hướng học liệu"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <div className="container ms-bottom-bar-inner">
            {position.previous ? (
              <Link
                className="ms-pager-link is-prev"
                to={studentMaterialLink(position.previous)}
                title={`Học liệu trước: ${position.previous.title}`}
              >
                <Icon name="prev" size={18} />
                <span className="ms-pager-text">
                  <small>‹ Học liệu trước</small>
                  <span className="ms-pager-title">{position.previous.title}</span>
                </span>
              </Link>
            ) : (
              <span className="ms-pager-link is-empty" aria-hidden="true" />
            )}

            <div
              className="ms-pager-count-badge"
              aria-label={`Học liệu ${position.index} trên ${position.total}`}
            >
              Học liệu <strong>{position.index}</strong> / {position.total}
            </div>

            {position.next ? (
              <Link
                className="ms-pager-link is-next"
                to={studentMaterialLink(position.next)}
                title={`Học liệu tiếp: ${position.next.title}`}
              >
                <span className="ms-pager-text text-end">
                  <small>Học liệu tiếp theo ›</small>
                  <span className="ms-pager-title">{position.next.title}</span>
                </span>
                <Icon name="next" size={18} />
              </Link>
            ) : canComplete ? (
              <Link
                className="ms-pager-link is-next is-finish is-complete-ready"
                to={`${lessonLink}#complete`}
                title="Hoàn thành bài học"
              >
                <span className="ms-pager-text text-end">
                  <small>Học liệu cuối cùng</small>
                  <strong className="ms-pager-title">Hoàn thành bài ✓</strong>
                </span>
                <Icon name="check" size={18} />
              </Link>
            ) : (
              <Link
                className="ms-pager-link is-next is-finish is-incomplete"
                to={`${lessonLink}#complete`}
                title={`Còn ${missing.length} mục chưa hoàn thành`}
              >
                <span className="ms-pager-text text-end">
                  <small>Còn {missing.length} mục cần nộp</small>
                  <span className="ms-pager-title">Về bài học kiểm tra</span>
                </span>
                <Icon name="next" size={18} />
              </Link>
            )}
          </div>
        </motion.footer>
      )}
    </div>
  );
}
