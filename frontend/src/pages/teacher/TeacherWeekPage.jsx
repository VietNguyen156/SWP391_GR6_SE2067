import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import Icon from "../../components/common/Icon";
import IconButton from "../../components/common/IconButton";
import LoadingState from "../../components/common/LoadingState";
import VisibilitySwitch from "../../components/common/VisibilitySwitch";
import { useConfirm } from "../../components/common/ConfirmDialog";
import Dropdown from "../../components/course/Dropdown";
import EmptyArt from "../../components/course/EmptyArt";
import MaterialIcon from "../../components/course/MaterialIcon";
import Pager from "../../components/course/Pager";
import * as courseApi from "../../services/courseService";
import {
  MATERIAL_TYPES,
  countByType,
  materialLabel,
  teacherLessonLink,
  teacherWeekLink,
} from "../../utils/lessonMaterials";
import { apiError } from "../../utils/apiError";

// Trang tuần (cấp 2/3): danh sách bài của tuần; bấm một bài để mở trang bài học.
export default function TeacherWeekPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { courseId, weekId } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [course, weeks] = await Promise.all([
      courseApi.getTeacherCourse(courseId),
      courseApi.getTeacherCurriculum(courseId),
    ]);
    setData({ course, weeks });
  }
  useEffect(() => {
    setData(null);
    load().catch((e) => setLoadError(apiError(e, "Không thể tải tuần học")));
  }, [courseId, weekId]);

  if (loadError)
    return (
      <main className="container cs-page">
        <ErrorState
          error={loadError}
          actions={[{ label: "Về khóa học", to: `/teacher/courses/${courseId}` }]}
        />
      </main>
    );
  if (!data) return <LoadingState />;

  const { course, weeks } = data;
  const index = weeks.findIndex((item) => String(item.id) === String(weekId));
  const week = weeks[index];
  if (!week)
    return (
      <main className="container cs-page">
        <ErrorState
          error={{ message: "Không tìm thấy tuần học" }}
          actions={[{ label: "Về khóa học", to: `/teacher/courses/${courseId}` }]}
        />
      </main>
    );
  const previous = weeks[index - 1];
  const next = weeks[index + 1];
  const lessons = week.lessons || [];
  const newLessonLink = `/teacher/courses/${courseId}/weeks/${week.id}/lessons/new`;

  async function toggleStatus(status) {
    setBusy(true);
    setError("");
    try {
      await courseApi.updateCourseWeek(week.id, {
        title: week.title,
        description: week.description || "",
        status,
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Không thể đổi trạng thái tuần");
    } finally {
      setBusy(false);
    }
  }

  async function removeWeek() {
    if (
      !(await confirm({
        message: `Xóa “${week.title || `Tuần ${week.weekNumber}`}”?`,
        title: "Xóa tuần",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await courseApi.deleteCourseWeek(week.id);
      navigate(`/teacher/courses/${courseId}`, { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || "Không thể xóa tuần học");
    }
  }

  async function move(lesson, step) {
    const ids = lessons.map((item) => item.id);
    const from = ids.indexOf(lesson.id);
    const to = from + step;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setBusy(true);
    try {
      await courseApi.reorderWeekLessons(week.id, ids);
      await load();
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Không thể đổi thứ tự bài học");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container cs-page tc-page">
      <div className="tc-crumbs">
        <nav className="cs-breadcrumb" aria-label="Breadcrumb">
          <Link to="/teacher/courses">Khóa học</Link>
          <span aria-hidden="true"> / </span>
          <Link to={`/teacher/courses/${courseId}`}>{course.title}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Tuần {week.weekNumber}</span>
        </nav>
        <Pager
          previous={previous && { to: teacherWeekLink(courseId, previous.id), label: "Tuần trước" }}
          next={next && { to: teacherWeekLink(courseId, next.id), label: "Tuần sau" }}
        />
      </div>

      <header className="tc-head">
        <div className="tc-head-main">
          <p className="tc-kicker">Tuần {week.weekNumber}</p>
          <h1 className="cs-title">{week.title || `Tuần ${week.weekNumber}`}</h1>
          {week.description && (
            <p className="tc-desc" title={week.description}>
              {week.description}
            </p>
          )}
          <div className="tc-meta">
            <span>{lessons.length} bài</span>
            <VisibilitySwitch
              id="week-visible"
              className="cs-course-switch"
              value={week.status}
              onChange={toggleStatus}
              disabled={busy}
            />
          </div>
        </div>
        <div className="tc-head-actions">
          <Link className="btn btn-primary" to={newLessonLink}>
            <Icon name="plus" size={16} />
            Bài học
          </Link>
          <Dropdown
            label="⋯"
            ariaLabel="Tùy chọn tuần"
            toggleClassName="cs-icon-btn"
            items={[
              {
                label: "Sửa tuần",
                to: `/teacher/courses/${courseId}/weeks/${week.id}/edit`,
              },
              {
                label: "Xóa tuần",
                onClick: removeWeek,
                danger: true,
                disabled: lessons.length > 0,
                reason: `Tuần còn ${lessons.length} bài học. Xóa hoặc chuyển các bài trước.`,
              },
            ]}
          />
        </div>
      </header>

      {error && (
        <div className="alert alert-danger cs-alert" role="alert">
          {error}
        </div>
      )}

      {lessons.length ? (
        <ol className="tc-list" aria-label="Bài học của tuần">
          {lessons.map((lesson, i) => (
            <LessonLine
              key={lesson.id}
              lesson={lesson}
              order={i + 1}
              busy={busy}
              onUp={i > 0 ? () => move(lesson, -1) : null}
              onDown={i < lessons.length - 1 ? () => move(lesson, 1) : null}
            />
          ))}
        </ol>
      ) : (
        <div className="cs-card cs-empty">
          <EmptyArt />
          <p>Tuần này chưa có bài học.</p>
          <Link className="btn btn-primary btn-sm" to={newLessonLink}>
            <Icon name="plus" size={15} />
            Tạo bài học đầu tiên
          </Link>
        </div>
      )}
    </main>
  );
}

/** Một dòng bài: số thứ tự, tên, dãy icon học liệu, số học liệu, ↑↓, ›. Bấm dòng mở trang bài. */
function LessonLine({ lesson, order, busy, onUp, onDown }) {
  const navigate = useNavigate();
  const link = teacherLessonLink(lesson.id);
  const materials = lesson.materials || [];
  const counts = countByType(materials);
  const types = MATERIAL_TYPES.filter((type) => counts[type]);
  function open(event) {
    if (event.target.closest("a, button")) return;
    navigate(link);
  }
  return (
    <li className="tc-row" onClick={open}>
      <span className="tc-row-no">{order}</span>
      <Link className="tc-row-title" to={link}>
        {lesson.title}
      </Link>
      <span className="tc-row-types" aria-label="Học liệu trong bài">
        {types.map((type) => {
          const label = `${materialLabel[type]}${counts[type] > 1 ? ` ×${counts[type]}` : ""}`;
          return (
            <span key={type} role="img" aria-label={label} title={label}>
              <MaterialIcon type={type} />
            </span>
          );
        })}
      </span>
      <span className="tc-row-count">{materials.length} học liệu</span>
      <span className="tc-row-move">
        <IconButton
          icon="up"
          label={`Đưa “${lesson.title}” lên trên`}
          onClick={onUp}
          disabled={!onUp || busy}
          disabledReason={onUp ? "Đang lưu" : "Đã ở đầu tuần"}
          size={16}
        />
        <IconButton
          icon="down"
          label={`Đưa “${lesson.title}” xuống dưới`}
          onClick={onDown}
          disabled={!onDown || busy}
          disabledReason={onDown ? "Đang lưu" : "Đã ở cuối tuần"}
          size={16}
        />
      </span>
      <Icon name="next" size={18} className="tc-row-go" />
    </li>
  );
}
