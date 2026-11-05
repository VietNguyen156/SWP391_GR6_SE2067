import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Icon from "../../components/common/Icon";
import LoadingState from "../../components/common/LoadingState";
import VisibilitySwitch from "../../components/common/VisibilitySwitch";
import { useConfirm } from "../../components/common/ConfirmDialog";
import Dropdown from "../../components/course/Dropdown";
import EmptyArt from "../../components/course/EmptyArt";
import { classroomApi } from "../../services/classroomService";
import { courseToForm, coursePayload, levelLabel } from "../../components/course/courseFormModel";
import * as courseApi from "../../services/courseService";
import { formatMoney } from "../../utils/format";
import { rememberLastCourse } from "../../utils/lastCourse";
import { teacherWeekLink } from "../../utils/lessonMaterials";
import { classStatusLabel, contentStatusLabel } from "../../utils/statusLabels";

// Trang khóa học (cấp 1/3): thông tin khóa + lưới tuần. Tuần → trang tuần; bài → trang bài học.
export default function TeacherCourseDetailPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [courseData, weekData, classData] = await Promise.all([
      courseApi.getTeacherCourse(id),
      courseApi.getTeacherCurriculum(id),
      classroomApi.teacherList(),
    ]);
    setCourse(courseData);
    setWeeks(weekData);
    setClasses(classData.filter((classroom) => String(classroom.courseId) === String(id)));
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

      <section className="tc-class-panel" aria-labelledby="tc-class-title">
        <div className="tc-class-panel-head">
          <div>
            <h2 id="tc-class-title">Các lớp thuộc khóa học</h2>
            <p>{classes.length} lớp · Mỗi lớp có danh sách học viên và bài nộp riêng.</p>
          </div>
          <Link
            className="btn btn-primary"
            to={`/teacher/classes/new?courseId=${id}&returnTo=${encodeURIComponent(`/teacher/courses/${id}`)}`}
          >
            <Icon name="plus" size={17} />
            Tạo lớp
          </Link>
        </div>
        {classes.length ? (
          <div className="tc-class-list">
            {classes.map((classroom) => (
              <article className="tc-class-card" key={classroom.id}>
                <div className="tc-class-card-main">
                  <div className="tc-class-card-title">
                    <Link to={`/teacher/classes/${classroom.id}`}>{classroom.className}</Link>
                    <span className={`class-status ${String(classroom.status).toLowerCase()}`}>
                      {classStatusLabel(classroom.status)}
                    </span>
                  </div>
                  <p>
                    Mã lớp: {classroom.classCode}
                    {classroom.startDate && ` · Bắt đầu ${classroom.startDate}`}
                    {classroom.endDate && ` · Kết thúc ${classroom.endDate}`}
                  </p>
                </div>
                <div className="tc-class-card-students">
                  <strong>{classroom.studentCount}</strong>
                  <span>{classroom.maxStudents ? `/ ${classroom.maxStudents}` : ""} học viên</span>
                </div>
                <div className="tc-class-card-actions">
                  <Link
                    className="btn btn-outline-primary btn-sm"
                    to={`/teacher/classes/${classroom.id}`}
                  >
                    Chi tiết lớp
                  </Link>
                  <Link
                    className="btn btn-outline-secondary btn-sm"
                    to={`/teacher/classes/${classroom.id}/edit?returnTo=${encodeURIComponent(`/teacher/courses/${id}`)}`}
                  >
                    Sửa
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="tc-class-empty">
            <strong>Khóa học chưa có lớp nào</strong>
            <p>Tạo lớp đầu tiên. Bạn có thể mở nhiều lớp cho cùng một khóa học.</p>
          </div>
        )}
      </section>

      <WeekGrid courseId={id} weeks={weeks} onAdd={addWeek} busy={busy} />
      <section className="card p-3 p-md-4 mt-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h2 className="h5 mb-1">Test cuối khóa</h2>
          </div>
          <Link className="btn btn-primary" to={`/teacher/courses/${id}/test`}>
            Quản lý Test
          </Link>
        </div>
      </section>
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
