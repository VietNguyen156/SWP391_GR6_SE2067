import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Icon from "../../components/common/Icon";
import LoadingState from "../../components/common/LoadingState";
import VisibilitySwitch from "../../components/common/VisibilitySwitch";
import { useConfirm } from "../../components/common/ConfirmDialog";
import Dropdown from "../../components/course/Dropdown";
import EmptyArt from "../../components/course/EmptyArt";
import { courseToForm, coursePayload, levelLabel } from "../../components/course/courseFormModel";
import * as courseApi from "../../services/courseService";
import { formatMoney } from "../../utils/format";
import { rememberLastCourse } from "../../utils/lastCourse";
import { teacherWeekLink } from "../../utils/lessonMaterials";
import { contentStatusLabel } from "../../utils/statusLabels";

// Trang khóa học (cấp 1/3): thông tin khóa + lưới tuần. Tuần → trang tuần; bài → trang bài học.
export default function TeacherCourseDetailPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [courseData, weekData] = await Promise.all([
      courseApi.getTeacherCourse(id),
      courseApi.getTeacherCurriculum(id),
    ]);
    setCourse(courseData);
    setWeeks(weekData);
  }

  useEffect(() => {
    load().catch((e) => setLoadError(e.response?.data?.message || "Không thể tải khóa học"));
    rememberLastCourse(id);
  }, [id]);

  const totals = useMemo(
    () => ({
      lessons: weeks.reduce((sum, week) => sum + (week.lessons?.length || 0), 0),
      published: weeks.filter((week) => week.status === "PUBLISHED").length,
    }),
    [weeks],
  );

  // Link cũ ?week= (trước khi tách trang) → trang tuần tương ứng.
  const legacyWeek = params.get("week");
  if (legacyWeek) return <Navigate to={teacherWeekLink(id, legacyWeek)} replace />;
  // Tab cũ (?tab=settings / ?tab=classes) đã bỏ → trang sửa khóa / danh sách lớp lọc theo khóa.
  const legacyTab = params.get("tab");
  if (legacyTab === "settings") return <Navigate to={`/teacher/courses/${id}/edit`} replace />;
  if (legacyTab === "classes") return <Navigate to={`/teacher/classes?course=${id}`} replace />;

  async function addWeek() {
    setBusy(true);
    setError("");
    try {
      const next = Math.max(0, ...weeks.map((item) => item.weekNumber || 0)) + 1;
      const created = await courseApi.createCourseWeek(id, {
        title: `Tuần ${next}`,
        description: "",
        status: "DRAFT",
      });
      navigate(teacherWeekLink(id, created.id));
    } catch (e) {
      setError(e.response?.data?.message || "Không thể thêm tuần");
      setBusy(false);
    }
  }

  async function toggleStatus() {
    const status = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setBusy(true);
    setError("");
    try {
      const updated = await courseApi.updateCourse(id, {
        ...coursePayload(courseToForm(course)),
        status,
      });
      setCourse((current) => ({ ...current, status: updated?.status || status }));
    } catch (e) {
      setError(e.response?.data?.message || "Không thể đổi trạng thái khóa học");
    } finally {
      setBusy(false);
    }
  }

  async function removeCourse() {
    if (
      !(await confirm({
        message: `Xóa khóa học “${course.title}”?`,
        title: "Xóa khóa học",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await courseApi.deleteCourse(id);
      navigate("/teacher/courses", { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || "Không thể xóa khóa học");
    }
  }

  if (loadError) {
    return (
      <main className="container cs-page">
        <div className="alert alert-danger cs-alert" role="alert">
          {loadError}
        </div>
        <Link to="/teacher/courses">← Khóa học</Link>
      </main>
    );
  }
  if (!course) return <LoadingState />;

  return (
    <main className="container cs-page tc-page">
      <header className="tc-head">
        <div className="tc-head-main">
          <nav className="cs-breadcrumb" aria-label="Breadcrumb">
            <Link to="/teacher/courses">Khóa học</Link>
            <span aria-hidden="true"> /</span>
          </nav>
          <h1 className="cs-title">{course.title}</h1>
          <div className="tc-meta">
            <span>
              {levelLabel(course.level)} · {totals.published}/{weeks.length} tuần hiển thị ·{" "}
              {totals.lessons} bài ·{" "}
              <span title="Giá do quản trị viên đặt">
                {formatMoney(course.price, { freeLabel: "Miễn phí" })}
              </span>
            </span>
            <VisibilitySwitch
              id="course-visible"
              className="cs-course-switch"
              value={course.status}
              onChange={toggleStatus}
              disabled={busy}
            />
          </div>
        </div>
        <Dropdown
          label="⋯"
          ariaLabel="Tùy chọn khóa học"
          toggleClassName="cs-icon-btn"
          items={[
            { label: "Sửa thông tin", to: `/teacher/courses/${id}/edit` },
            { label: "Xóa khóa", onClick: removeCourse, danger: true },
          ]}
        />
      </header>

      {error && (
        <div className="alert alert-danger cs-alert d-flex align-items-start gap-2" role="alert">
          <span className="flex-grow-1">{error}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={() => setError("")}
          />
        </div>
      )}

      <WeekGrid courseId={id} weeks={weeks} onAdd={addWeek} busy={busy} />
    </main>
  );
}

/** Lưới thẻ tuần; thẻ cuối là ô thêm tuần. */
function WeekGrid({ courseId, weeks, onAdd, busy }) {
  return (
    <ol className="tc-weeks" aria-label="Các tuần của khóa học">
      {weeks.map((week) => {
        const live = week.status === "PUBLISHED";
        return (
          <li key={week.id}>
            <Link className="tc-week" to={teacherWeekLink(courseId, week.id)}>
              <span className="tc-week-top">
                <span className="tc-week-no">Tuần {week.weekNumber}</span>
                <span
                  className={`cs-dot ${live ? "is-live" : ""}`}
                  title={contentStatusLabel(week.status)}
                />
                <span className="visually-hidden">{contentStatusLabel(week.status)}</span>
              </span>
              <strong className="tc-week-title">{week.title || `Tuần ${week.weekNumber}`}</strong>
              <span className="tc-week-meta">{week.lessons?.length || 0} bài</span>
            </Link>
          </li>
        );
      })}
      <li>
        <button type="button" className="tc-week tc-week-add" onClick={onAdd} disabled={busy}>
          <Icon name="plus" size={20} />
          Thêm tuần
        </button>
      </li>
      {!weeks.length && (
        <li className="tc-weeks-empty">
          <EmptyArt />
          <p>Khóa học chưa có tuần nào.</p>
        </li>
      )}
    </ol>
  );
}
