import { useState } from "react";
import EditGate, { editTitle } from "../../components/common/EditGate";
import { weekToForm } from "../../utils/editForms";
import useEditForm from "../../utils/useEditForm";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormPage from "../../components/course/FormPage";
import {
  deleteCourseWeek,
  getTeacherCourse,
  getTeacherCurriculum,
  updateCourseWeek,
} from "../../services/courseService";
import VisibilitySwitch from "../../components/common/VisibilitySwitch";
import { teacherWeekLink } from "../../utils/lessonMaterials";

export default function WeekEditorPage() {
  const confirm = useConfirm();
  const { courseId, weekId } = useParams();
  const navigate = useNavigate();
  const backTo = teacherWeekLink(courseId, weekId);
  const edit = useEditForm(async () => {
    const [items, course] = await Promise.all([
      getTeacherCurriculum(courseId),
      getTeacherCourse(courseId),
    ]);
    const week = items.find((item) => String(item.id) === String(weekId));
    if (!week) throw new Error("Không tìm thấy tuần học");
    return { course, week, form: weekToForm(week) };
  }, [courseId, weekId]);
  const { form, setForm } = edit;
  const { course, week } = edit.extra;
  const [state, setState] = useState({ saving: false, error: "" });

  async function save(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      await updateCourseWeek(weekId, form);
      navigate(backTo);
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Không thể lưu tuần học",
      }));
    }
  }

  async function remove() {
    if (
      !(await confirm({
        message: `Xóa “${form.title}”?`,
        title: "Xóa tuần",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await deleteCourseWeek(weekId);
      navigate(`/teacher/courses/${courseId}`, { replace: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Không thể xóa tuần học",
      }));
    }
  }

  if (!edit.ready)
    return (
      <EditGate edit={edit} back={{ label: "Về khóa học", to: `/teacher/courses/${courseId}` }} />
    );

  const crumbs = [
    { label: "Khóa học", to: "/teacher/courses" },
    ...(course ? [{ label: course.title, to: backTo }] : []),
  ];

  return (
    <FormPage
      crumbs={crumbs}
      title={editTitle(true, `Tuần ${week.weekNumber}: ${week.title}`)}
      error={state.error}
    >
      {
        <>
          <form className="cs-form" onSubmit={save}>
            <section className="cs-card cs-form-section">
              <div className="cs-field">
                <label className="form-label" htmlFor="cs-week-name">
                  Tên tuần
                </label>
                <input
                  id="cs-week-name"
                  className="form-control"
                  required
                  maxLength="200"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="cs-field">
                <label className="form-label" htmlFor="cs-week-description">
                  Mô tả
                </label>
                <textarea
                  id="cs-week-description"
                  className="form-control"
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="cs-field cs-field-narrow">
                <VisibilitySwitch
                  id="cs-week-visible"
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                />
              </div>
            </section>
            <div className="cs-form-actions">
              <Link className="btn btn-link cs-btn-quiet" to={backTo}>
                Hủy
              </Link>
              <button className="btn btn-primary" disabled={state.saving}>
                {state.saving ? "Đang lưu…" : "Lưu tuần"}
              </button>
            </div>
          </form>
          <div className="cs-danger-row">
            {week.lessons?.length ? (
              <span className="cs-muted" title="Xóa hoặc chuyển các bài học của tuần trước">
                Không thể xóa tuần còn {week.lessons.length} bài học
              </span>
            ) : (
              <button type="button" className="btn btn-link cs-btn-danger-link" onClick={remove}>
                Xóa tuần
              </button>
            )}
          </div>
        </>
      }
    </FormPage>
  );
}
