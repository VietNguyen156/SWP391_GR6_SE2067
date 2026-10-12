import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import Icon from "../../components/common/Icon";
import LoadingState from "../../components/common/LoadingState";
import { useConfirm } from "../../components/common/ConfirmDialog";
import Dropdown from "../../components/course/Dropdown";
import EmptyArt from "../../components/course/EmptyArt";
import MaterialLine from "../../components/course/MaterialLine";
import Pager from "../../components/course/Pager";
import * as courseApi from "../../services/courseService";
import {
  MATERIAL_DETAIL_LISTS,
  loadMaterialDetails,
  removeMaterial,
} from "../../services/materialService";
import { apiError } from "../../utils/apiError";
import {
  addMaterialLinks,
  materialLabel,
  sortByType,
  teacherLessonLink,
  teacherWeekLink,
} from "../../utils/lessonMaterials";
import { buildRows } from "../../utils/materialLibrary";
import { currentPath, withReturnTo } from "../../utils/returnTo";

async function loadLesson(id) {
  const lesson = await courseApi.getTeacherLesson(id);
  const [weeks, details] = await Promise.all([
    courseApi.getTeacherCurriculum(lesson.courseId),
    loadMaterialDetails(Object.keys(MATERIAL_DETAIL_LISTS)),
  ]);
  const course = { id: lesson.courseId, title: lesson.courseTitle };
  const rows = sortByType(
    buildRows([course], { [course.id]: weeks }, details).filter(
      (row) => String(row.lessonId) === String(id),
    ),
  );
  // Bài trước / sau theo thứ tự trong khóa (tuần rồi tới bài).
  const order = weeks.flatMap((week) => (week.lessons || []).map((item) => item.id));
  const at = order.findIndex((item) => String(item) === String(id));
  return { lesson, rows, previous: order[at - 1], next: order[at + 1] };
}

// Trang bài học (cấp 3/3): học liệu của bài; sửa hoặc thêm học liệu rồi quay lại đây.
export default function TeacherLessonPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const here = currentPath(useLocation());
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setData(await loadLesson(id));
  }
  useEffect(() => {
    setData(null);
    load().catch((e) => setLoadError(apiError(e, "Không thể tải bài học")));
  }, [id]);

  if (loadError)
    return (
      <main className="container cs-page">
        <ErrorState error={loadError} actions={[{ label: "Khóa học", to: "/teacher/courses" }]} />
      </main>
    );
  if (!data) return <LoadingState />;

  const { lesson, rows, previous, next } = data;
  const weekLink = teacherWeekLink(lesson.courseId, lesson.courseWeekId);

  async function removeLesson() {
    if (
      !(await confirm({
        message: `Xóa bài “${lesson.title}”?`,
        title: "Xóa bài học",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await courseApi.deleteLesson(lesson.id);
      navigate(weekLink, { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || "Không thể xóa bài học");
    }
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Xóa ${materialLabel[row.type]}`,
      message: `Xóa “${row.title}”?`,
      confirmLabel: "Xóa",
      danger: true,
    });
    if (!ok) return;
    try {
      await removeMaterial(row.type, row.id);
      await load();
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Không thể xóa học liệu");
    }
  }

  const addMenu = (
    <Dropdown
      label={
        <>
          <Icon name="plus" size={16} />
          Thêm học liệu
        </>
      }
      ariaLabel="Thêm học liệu vào bài"
      toggleClassName="btn btn-primary"
      items={addMaterialLinks(lesson.courseId, lesson.courseWeekId, lesson.id).map((item) => ({
        label: item.label,
        to: item.to,
      }))}
    />
  );

  return (
    <main className="container cs-page tc-page">
      <div className="tc-crumbs">
        <nav className="cs-breadcrumb" aria-label="Breadcrumb">
          <Link to="/teacher/courses">Khóa học</Link>
          <span aria-hidden="true"> / </span>
          <Link to={`/teacher/courses/${lesson.courseId}`}>{lesson.courseTitle}</Link>
          <span aria-hidden="true"> / </span>
          <Link to={weekLink}>Tuần {lesson.weekNumber}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Bài {lesson.sortOrder}</span>
        </nav>
        <Pager
          previous={previous && { to: teacherLessonLink(previous), label: "Bài trước" }}
          next={next && { to: teacherLessonLink(next), label: "Bài sau" }}
        />
      </div>

      <header className="tc-head">
        <div className="tc-head-main">
          <p className="tc-kicker">
            Tuần {lesson.weekNumber} · Bài {lesson.sortOrder}
          </p>
          <h1 className="cs-title">{lesson.title}</h1>
          {lesson.description && <p className="tc-desc">{lesson.description}</p>}
          <div className="tc-meta">
            <span>
              {rows.length} học liệu
              {lesson.estimatedMinutes ? ` · ${lesson.estimatedMinutes} phút` : ""}
            </span>
          </div>
        </div>
        <div className="tc-head-actions">
          {addMenu}
          <Dropdown
            label="⋯"
            ariaLabel="Tùy chọn bài học"
            toggleClassName="cs-icon-btn"
            items={[
              {
                label: "Sửa thông tin bài",
                to: withReturnTo(`/teacher/lessons/${lesson.id}/week-edit`, here),
              },
              {
                label: "Xóa bài",
                onClick: removeLesson,
                danger: true,
                disabled: rows.length > 0,
                reason: "Xóa hết học liệu trong bài trước",
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

      {rows.length ? (
        <ul className="ml-list ml-block tc-materials" aria-label="Học liệu của bài">
          {rows.map((row) => (
            <MaterialLine key={row.key} row={row} here={here} onRemove={remove} />
          ))}
        </ul>
      ) : (
        <div className="cs-card cs-empty">
          <EmptyArt />
          <p>Bài này chưa có học liệu.</p>
          {addMenu}
        </div>
      )}
    </main>
  );
}
