import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EditGate, { editTitle } from "../../components/common/EditGate";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { classroomApi } from "../../services/classroomService";
import { getTeacherCourses } from "../../services/courseService";
import { classToForm } from "../../utils/editForms";
import { CLASS_STATUSES, classStatusLabel, classStatusValue } from "../../utils/statusLabels";
import useEditForm from "../../utils/useEditForm";
import { useReturnTo } from "../../utils/useReturnTo";

const empty = {
  courseId: "",
  className: "",
  classCode: "",
  description: "",
  startDate: "",
  endDate: "",
  maxStudents: "",
  status: "OPEN",
};

export default function ClassEditorPage() {
  const { id } = useParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  // Mở từ tab Lớp học của khóa: chọn sẵn khóa (?courseId=) và quay về đó (?returnTo=).
  const [params] = useSearchParams();
  const presetCourse = params.get("courseId");
  const back = useReturnTo("/teacher/classes", "Danh sách lớp");
  const edit = useEditForm(async () => {
    const [courses, detail] = await Promise.all([
      getTeacherCourses(),
      editing ? classroomApi.teacherGet(id) : null,
    ]);
    return {
      courses,
      name: detail?.classroom?.className,
      form: detail
        ? classToForm(detail)
        : {
            ...empty,
            courseId: courses.some((c) => String(c.id) === presetCourse)
              ? presetCourse
              : String(courses[0]?.id || ""),
          },
    };
  }, [id, presetCourse]);
  const { form, setForm } = edit;
  const courses = edit.extra.courses || [];
  const [state, setState] = useState({ saving: false, error: "" });
  async function save(e) {
    e.preventDefault();
    setState({ saving: true, error: "" });
    try {
      const payload = {
        ...form,
        courseId: Number(form.courseId),
        maxStudents: form.maxStudents ? Number(form.maxStudents) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      if (editing) await classroomApi.update(id, payload);
      else await classroomApi.create(payload);
      nav(back.to);
    } catch (err) {
      setState({ saving: false, error: err.response?.data?.message || "Không thể lưu lớp học" });
    }
  }
  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <PageHeader crumbs={[back]} title={editTitle(editing, edit.extra.name, "Tạo lớp mới")} />
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Khóa học</label>
            <select
              required
              className="form-select"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            >
              <option value="">Chọn khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-8">
            <label className="form-label">Tên lớp</label>
            <input
              required
              className="form-control"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Mã lớp</label>
            <input
              className="form-control"
              value={form.classCode}
              onChange={(e) => setForm({ ...form, classCode: e.target.value })}
              placeholder="Tự động"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Ngày bắt đầu</label>
            <input
              className="form-control"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Ngày kết thúc</label>
            <input
              className="form-control"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Sĩ số tối đa</label>
            <input
              className="form-control"
              type="number"
              min="1"
              value={form.maxStudents}
              onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Trạng thái</label>
            <select
              className="form-select"
              value={classStatusValue(form.status)}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {CLASS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {classStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-control"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button className="btn btn-primary" disabled={state.saving}>
            {state.saving ? "Đang lưu…" : "Lưu lớp học"}
          </button>
        </div>
      </form>
    </main>
  );
}
