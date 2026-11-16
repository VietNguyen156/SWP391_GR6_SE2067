import { useEffect, useMemo, useState } from "react";
import { useSuccessToast } from "../../components/common/Toast";
import { useConfirm } from "../../components/common/ConfirmDialog";
import CourseManagementTable from "../../components/admin/CourseManagementTable";
import { adminApi } from "../../services/adminService";
import { adminOrderApi } from "../../services/orderService";

export default function AdminCoursesPage() {
  const confirm = useConfirm();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [state, setState] = useState({ loading: true, busyId: null, error: "", message: "" });
  useSuccessToast(state.message);

  async function load() {
    try {
      setCourses(await adminApi.courses());
      setState((s) => ({ ...s, loading: false, error: "" }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e.response?.data?.message || "Không thể tải khóa học",
      }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      courses.filter((course) =>
        `${course.title} ${course.teacherName} ${course.teacherEmail}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [courses, search],
  );

  async function status(id, value) {
    setState((s) => ({ ...s, busyId: id, error: "", message: "" }));
    try {
      const updated = await adminApi.updateCourseStatus(id, value);
      setCourses((items) => items.map((item) => (item.id === id ? updated : item)));
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e.response?.data?.message || "Không thể cập nhật khóa học",
      }));
    } finally {
      setState((s) => ({ ...s, busyId: null }));
    }
  }

  async function price(course, value) {
    setState((s) => ({ ...s, error: "", message: "" }));
    try {
      const updated = await adminOrderApi.setPrice(course.id, value);
      setCourses((items) => items.map((item) => (item.id === course.id ? updated : item)));
      setState((s) => ({ ...s, message: `Đã đặt giá khóa “${course.title}”.` }));
      return true;
    } catch (e) {
      setState((s) => ({ ...s, error: e.response?.data?.message || "Không thể cập nhật giá" }));
      return false;
    }
  }

  async function toggleActive(course) {
    const disabled = course.status === "HIDDEN" || course.status === "ARCHIVED";
    const nextStatus = disabled ? "ACTIVE" : "HIDDEN";
    const actionText = disabled ? "kích hoạt lại" : "vô hiệu hóa";
    if (
      !(await confirm({
        message: `Bạn có chắc muốn ${actionText} khóa học “${course.title}”?`,
        title: "Đổi trạng thái khóa học",
        confirmLabel: "Đồng ý",
      }))
    )
      return;
    await status(course.id, nextStatus);
    setState((s) => ({
      ...s,
      message: disabled
        ? "Đã kích hoạt lại khóa học."
        : "Đã vô hiệu hóa khóa học. Dữ liệu vẫn được giữ nguyên.",
    }));
  }

  return (
    <>
      <header className="admin-page-header">
        <h1>Quản lý khóa học</h1>
        <p>Kiểm duyệt nội dung và trạng thái của mọi khóa học.</p>
      </header>
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <div className="admin-filters">
        <input
          className="form-control"
          placeholder="Tìm khóa học hoặc giáo viên…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {state.loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <CourseManagementTable
          courses={filtered}
          busyId={state.busyId}
          onStatus={status}
          onToggleActive={toggleActive}
          onPrice={price}
        />
      )}
    </>
  );
}
