import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { enumLabel } from "../../utils/statusLabels";
import { useSuccessToast } from "../../components/common/Toast";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { grammarApi } from "../../services/learningContentService";
import { grammarToForm } from "../../utils/editForms";
import { getTeacherCurriculum } from "../../services/courseService";
import { loadPlacement } from "../../utils/teacherPlacement";
import { withReturnTo } from "../../utils/returnTo";
import { useReturnTo } from "../../utils/useReturnTo";
import LessonPlacement from "../../components/course/LessonPlacement";
import EditGate, { editTitle } from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";

const blank = {
  title: "",
  description: "",
  level: "BEGINNER",
  courseId: "",
  courseWeekId: "",
  lessonId: "",
};
const emptyContent = { id: null, ruleContent: "", examples: "", notes: "", sortOrder: "" };
export default function GrammarEditorPage() {
  const confirm = useConfirm();
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  const back = useReturnTo("/teacher/library?type=GRAMMAR", "Thư viện học liệu");
  const edit = useEditForm(async () => {
    const data = editing ? await grammarApi.teacherGet(id) : null;
    const { courses, weeks, placement } = await loadPlacement(data, params);
    return {
      courses,
      weeks,
      topic: data,
      form: data ? grammarToForm(data, placement.courseId) : { ...blank, ...placement },
    };
  }, [id]);
  const { form, setForm } = edit;
  const { courses = [], weeks = [], topic } = edit.extra;
  const setWeeks = (list) => edit.setExtra({ weeks: list });
  const setTopic = (value) => edit.setExtra({ topic: value });
  const [content, setContent] = useState(emptyContent),
    [state, setState] = useState({ saving: false, error: "", message: "" });
  useSuccessToast(state.message);
  async function chooseCourse(v) {
    setForm((f) => ({ ...f, courseId: v, courseWeekId: "", lessonId: "" }));
    setWeeks(v ? await getTeacherCurriculum(v) : []);
  }
  async function save(e) {
    e.preventDefault();
    if (!form.courseWeekId || !form.lessonId) {
      setState((s) => ({ ...s, error: "Vui lòng chọn đầy đủ khóa học, tuần và bài học" }));
      return;
    }
    setState((s) => ({ ...s, saving: true, error: "" }));
    try {
      const payload = {
        courseWeekId: Number(form.courseWeekId),
        lessonId: form.lessonId ? Number(form.lessonId) : null,
        title: form.title,
        description: form.description,
        level: form.level,
      };
      const saved = editing
        ? await grammarApi.updateTopic(id, payload)
        : await grammarApi.createTopic(payload);
      if (!editing) {
        // Chủ đề mới cần thêm phần giải thích ngay; giữ nguyên nơi quay về.
        nav(withReturnTo(`/teacher/grammar/${saved.id}/edit`, back.to), { replace: true });
        return;
      }
      setTopic(await grammarApi.teacherGet(id));
      setState((s) => ({ ...s, saving: false, message: "Đã lưu chủ đề" }));
    } catch (err) {
      setState((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.message || "Không thể lưu",
      }));
    }
  }
  async function saveContent(e) {
    e.preventDefault();
    if (!id) return;
    setState((s) => ({ ...s, saving: true, error: "" }));
    try {
      const payload = {
        ruleContent: content.ruleContent,
        examples: content.examples,
        notes: content.notes,
        sortOrder: content.sortOrder ? Number(content.sortOrder) : null,
      };
      if (content.id) await grammarApi.updateContent(content.id, payload);
      else await grammarApi.addContent(id, payload);
      setTopic(await grammarApi.teacherGet(id));
      setContent(emptyContent);
      setState((s) => ({ ...s, saving: false, message: "Đã lưu nội dung" }));
    } catch (err) {
      setState((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.message || "Không thể lưu nội dung",
      }));
    }
  }
  async function removeContent(item) {
    if (
      !(await confirm({
        message: `Xóa phần ${item.sortOrder}?`,
        title: "Xóa nội dung",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    setState((s) => ({ ...s, error: "", message: "" }));
    try {
      await grammarApi.deleteContent(item.id);
      setTopic(await grammarApi.teacherGet(id));
      setState((s) => ({ ...s, message: "Đã xóa nội dung" }));
    } catch (err) {
      setState((s) => ({ ...s, error: err.response?.data?.message || "Không thể xóa nội dung" }));
    }
  }
  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <PageHeader crumbs={[back]} title={editTitle(editing, topic?.title, "Tạo chủ đề ngữ pháp")} />
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form className="teacher-panel p-4 mb-4" onSubmit={save}>
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">Tên chủ đề</label>
            <input
              required
              className="form-control"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Trình độ</label>
            <select
              className="form-select"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="BEGINNER">{enumLabel("BEGINNER")}</option>
              <option value="INTERMEDIATE">{enumLabel("INTERMEDIATE")}</option>
              <option value="ADVANCED">{enumLabel("ADVANCED")}</option>
            </select>
          </div>
          <div className="col-12">
            <LessonPlacement
              courses={courses}
              weeks={weeks}
              value={form}
              onCourse={chooseCourse}
              onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            />
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
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Link className="btn btn-link" to={back.to}>
            {editing ? "Xong" : "Hủy"}
          </Link>
          <button className="btn btn-primary" disabled={state.saving}>
            {state.saving ? "Đang lưu…" : "Lưu chủ đề"}
          </button>
        </div>
      </form>
      {editing && topic && (
        <>
          <section className="teacher-panel p-4 mb-4">
            <h2 className="h5 fw-bold">Nội dung giải thích ({topic.contents?.length || 0})</h2>
            {(topic.contents || []).map((c) => (
              <div className="admin-content-row" key={c.id}>
                <div>
                  <b>Phần {c.sortOrder}</b>
                  <p>{c.ruleContent}</p>
                </div>
                <div className="admin-content-actions">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setContent({ ...c })}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeContent(c)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </section>
          <form className="teacher-panel p-4" onSubmit={saveContent}>
            <h2 className="h5 fw-bold">{content.id ? "Sửa nội dung" : "Thêm giải thích"}</h2>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Quy tắc</label>
                <textarea
                  required
                  className="form-control"
                  rows="5"
                  value={content.ruleContent}
                  onChange={(e) => setContent({ ...content, ruleContent: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Ví dụ</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={content.examples || ""}
                  onChange={(e) => setContent({ ...content, examples: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Ghi chú</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={content.notes || ""}
                  onChange={(e) => setContent({ ...content, notes: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Thứ tự</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={content.sortOrder || ""}
                  onChange={(e) => setContent({ ...content, sortOrder: e.target.value })}
                />
              </div>
            </div>
            <div className="text-end mt-3">
              <button className="btn btn-dark">Lưu nội dung</button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
