import { useState } from "react";
import EditGate, { editTitle } from "../../components/common/EditGate";
import { lessonToForm } from "../../utils/editForms";
import useEditForm from "../../utils/useEditForm";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { safeReturnTo } from "../../utils/returnTo";
import { teacherCourseLink, teacherLessonLink } from "../../utils/lessonMaterials";
import FormPage from "../../components/course/FormPage";
import {
  createLesson,
  getTeacherCourse,
  getTeacherLesson,
  updateLesson,
} from "../../services/courseService";

const blank = {
  courseId: "",
  courseWeekId: "",
  title: "",
  description: "",
  estimatedMinutes: "",
};

export default function WeekLessonEditorPage() {
  const { courseId, weekId, id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editing = Boolean(id);
  // Sửa: lấy bài (đã có tên khóa); tạo mới: lấy tên khóa từ courseId trên URL.
  const edit = useEditForm(async () => {
    if (editing) {
      const lesson = await getTeacherLesson(id);
      return { lesson, courseTitle: lesson.courseTitle, form: lessonToForm(lesson) };
    }
    const course = await getTeacherCourse(courseId);
    return {
      courseTitle: course.title,
      form: { ...blank, courseId: String(courseId), courseWeekId: String(weekId) },
    };
  }, [id, courseId, weekId]);
  const { form, setForm } = edit;
  const courseTitle = edit.extra.courseTitle || "";
  const [state, setState] = useState({ saving: false, error: "" });

  const backCourseId = form?.courseId || courseId;
  const backWeekId = form?.courseWeekId || weekId;
  const backTo = teacherCourseLink(backCourseId, backWeekId);
  // Có returnTo (trang bài học) thì quay lại đó; còn lại về trang tuần.
  const explicitReturn = safeReturnTo(params.get("returnTo"), null);
  const cancelTo = explicitReturn || backTo;

  function set(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      const payload = {
        courseWeekId: Number(weekId || form.courseWeekId),
        title: form.title,
        description: form.description,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
      };
      const saved = editing ? await updateLesson(id, payload) : await createLesson(payload);
      // Lưu xong mở trang bài học (bài mới: thêm học liệu ngay).
      navigate(explicitReturn || teacherLessonLink(saved.id));
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Không thể lưu bài học",
      }));
    }
  }

  if (!edit.ready)
    return <EditGate edit={edit} back={{ label: "Khóa học", to: "/teacher/courses" }} />;

  const crumbs = [
    { label: "Khóa học", to: "/teacher/courses" },
    ...(backCourseId && courseTitle ? [{ label: courseTitle, to: backTo }] : []),
  ];

  return (
    <FormPage
      crumbs={crumbs}
      title={editTitle(editing, edit.extra.lesson?.title, "Tạo bài học")}
      error={state.error}
    >
      {
        <form className="cs-form" onSubmit={save}>
          <section className="cs-card cs-form-section">
            <div className="cs-field">
              <label className="form-label" htmlFor="cs-lesson-title">
                Tên bài
              </label>
              <input
                id="cs-lesson-title"
                required
                className="form-control"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="cs-field">
              <label className="form-label" htmlFor="cs-lesson-description">
                Mô tả
              </label>
              <textarea
                id="cs-lesson-description"
                className="form-control"
                rows="3"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="cs-field cs-field-narrow">
              <label className="form-label" htmlFor="cs-lesson-minutes">
                Thời lượng (phút)
              </label>
              <input
                id="cs-lesson-minutes"
                className="form-control"
                type="number"
                min="1"
                value={form.estimatedMinutes}
                onChange={(e) => set("estimatedMinutes", e.target.value)}
              />
            </div>
          </section>

          <div className="cs-form-actions">
            <Link className="btn btn-link cs-btn-quiet" to={cancelTo}>
              Hủy
            </Link>
            <button className="btn btn-primary" disabled={state.saving}>
              {state.saving ? "Đang lưu…" : editing ? "Lưu bài học" : "Tạo bài học"}
            </button>
          </div>
        </form>
      }
    </FormPage>
  );
}
