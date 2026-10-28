import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Icon from "../../components/common/Icon";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ClassTable from "../../components/classroom/ClassTable";
import { classroomApi } from "../../services/classroomService";
import { getTeacherCourses } from "../../services/courseService";
import { CLASS_STATUSES, classStatusLabel, classStatusValue } from "../../utils/statusLabels";

export default function ClassManagementPage() {
  const confirm = useConfirm();
  const nav = useNavigate();
  const [classes, setClasses] = useState([]),
    [courses, setCourses] = useState([]),
    [state, setState] = useState({ loading: true, error: "" });
  async function load() {
    try {
      const [a, b] = await Promise.all([classroomApi.teacherList(), getTeacherCourses()]);
      setClasses(a);
      setCourses(b);
      setState({ loading: false, error: "" });
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || "Không thể tải lớp học" });
    }
  }
  useEffect(() => {
    load();
  }, []);
  // Bộ lọc lưu trên URL (?course=&status=) để quay lại vẫn giữ nguyên.
  const [params, setParams] = useSearchParams();
  const course = params.get("course") || "";
  const status = params.get("status") || "";
  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const byCourse = useMemo(
    () => classes.reduce((acc, x) => ({ ...acc, [x.courseId]: (acc[x.courseId] || 0) + 1 }), {}),
    [classes],
  );
  // Ô chọn khóa: chỉ các khóa đang có lớp (và khóa đang chọn), xếp theo tên — gọn khi có nhiều khóa.
  const courseOptions = useMemo(
    () =>
      courses
        .filter((c) => byCourse[c.id] || String(c.id) === course)
        .sort((a, b) => a.title.localeCompare(b.title, "vi")),
    [courses, byCourse, course],
  );
  // Lọc theo khóa, trạng thái; xếp theo khóa rồi ngày bắt đầu mới nhất.
  const filtered = useMemo(
    () =>
      classes
        .filter(
          (x) =>
            (!course || String(x.courseId) === course) &&
            (!status || classStatusValue(x.status) === classStatusValue(status)),
        )
        .sort(
          (a, b) =>
            a.courseTitle.localeCompare(b.courseTitle, "vi") ||
            String(b.startDate || "").localeCompare(String(a.startDate || "")),
        ),
    [classes, course, status],
  );
  const active = classes.filter((x) => x.status === "OPEN").length,
    students = classes.reduce((s, x) => s + Number(x.studentCount || 0), 0);
  async function remove(item) {
    if (
      !(await confirm({
        message: `Xóa lớp “${item.className}”?`,
        title: "Xóa lớp",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await classroomApi.remove(item.id);
      await load();
    } catch (e) {
      setState((s) => ({ ...s, error: e.response?.data?.message || "Không thể xóa lớp" }));
    }
  }
  return (
    <main className="container course-shell">
      <PageHeader
        title={"Quản lý lớp học"}
        actions={
          <>
            <Link
              className="btn btn-primary"
              to={`/teacher/classes/new${course ? `?courseId=${course}` : ""}`}
            >
              <Icon name="plus" size={18} /> Tạo lớp
            </Link>
          </>
        }
      />
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <div className="teacher-summary-grid mb-3">
        <div className="teacher-summary-card">
          <span>Tổng lớp</span>
          <strong>{classes.length}</strong>
        </div>
        <div className="teacher-summary-card">
          <span>Đang hoạt động</span>
          <strong>{active}</strong>
        </div>
        <div className="teacher-summary-card">
          <span>Học viên</span>
          <strong>{students}</strong>
        </div>
        <div className="teacher-summary-card">
          <span>Khóa học</span>
          <strong>{courses.length}</strong>
        </div>
      </div>
      <section className="teacher-panel">
        <div className="teacher-panel-head">
          <div>
            <h2>Danh sách lớp</h2>
          </div>
          <div className="class-filter-tools">
            <select
              className="form-select class-course-select"
              aria-label="Lọc theo khóa học"
              value={course}
              onChange={(e) => setFilter("course", e.target.value)}
            >
              <option value="">Tất cả khóa ({classes.length} lớp)</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title} ({byCourse[c.id] || 0})
                </option>
              ))}
            </select>
            <select
              className="form-select"
              aria-label="Lọc theo trạng thái"
              value={status}
              onChange={(e) => setFilter("status", e.target.value)}
            >
              <option value="">Mọi trạng thái</option>
              {CLASS_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {classStatusLabel(value)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="teacher-panel-body p-0">
          {state.loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : (
            <ClassTable
              classes={filtered}
              emptyText={classes.length ? "Không có lớp nào khớp bộ lọc." : "Chưa có lớp học."}
              onEdit={(item) => nav(`/teacher/classes/${item.id}/edit`)}
              onDelete={remove}
            />
          )}
        </div>
      </section>
    </main>
  );
}
