import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { speakingApi } from "../../services/learningContentService";
import { speakingToForm } from "../../utils/editForms";
import { getTeacherCurriculum } from "../../services/courseService";
import { loadPlacement } from "../../utils/teacherPlacement";
import { EditHeader, SaveBar, editorTitle } from "../../components/material-view/EditFrame";
import {
  materialContext,
  materialExitLink,
  teacherMaterialView,
} from "../../utils/lessonMaterials";
import useUnsavedGuard from "../../utils/useUnsavedGuard";
import LessonPlacement from "../../components/course/LessonPlacement";
import EditGate from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";
const blank = {
  courseId: "",
  courseWeekId: "",
  lessonId: "",
  title: "",
  instruction: "",
  promptText: "",
};
export default function SpeakingEditorPage({ mode: routeMode }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  // Sửa thông tin (/edit) và sửa nội dung (/content) là hai trang; tạo mới có cả hai phần.
  const mode = editing ? routeMode || "info" : "all";
  const ctx = materialContext(params);
  const back = editing
    ? { to: teacherMaterialView("SPEAKING", id, ctx), label: "Quay lại xem" }
    : { to: materialExitLink("SPEAKING", ctx), label: "Quay lại" };
  const edit = useEditForm(async () => {
    const d = editing ? await speakingApi.teacherGet(id) : null;
    const { courses, weeks, placement } = await loadPlacement(d, params);
    return {
      courses,
      weeks,
      name: d?.title,
      inUse: Boolean(d?.inUse),
      form: d ? speakingToForm(d, placement.courseId) : { ...blank, ...placement },
    };
  }, [id]);
  const { form, setForm } = edit;
  const { courses = [], weeks = [], inUse = false } = edit.extra;
  const setWeeks = (list) => edit.setExtra({ weeks: list });
  const [state, setState] = useState({ saving: false, error: "" });
  const release = useUnsavedGuard(edit.dirty);
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
      const p = {
        courseWeekId: Number(form.courseWeekId),
        lessonId: form.lessonId ? Number(form.lessonId) : null,
        title: form.title,
        instruction: form.instruction,
        promptText: form.promptText,
      };
      const saved = editing
        ? await speakingApi.teacherUpdate(id, p)
        : await speakingApi.teacherCreate(p);
      release();
      nav(teacherMaterialView("SPEAKING", saved?.id ?? id, ctx), { replace: true });
    } catch (err) {
      setState((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.message || "Không thể lưu",
      }));
    }
  }
  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <EditHeader title={editorTitle(mode, edit.extra.name, "Tạo bài Speaking")} back={back} />
      {inUse && (
        <div className="alert alert-warning">
          Bài Speaking đã có học viên nộp nên không thể sửa nội dung. Bạn vẫn chấm bài bên dưới bình
          thường.
        </div>
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form id="material-form" className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
          {mode !== "content" && (
            <>
              <div className="col-12">
                <label className="form-label">Tên bài</label>
                <input
                  required
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
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
            </>
          )}
          {mode !== "info" && (
            <>
              <div className="col-md-6">
                <label className="form-label">Yêu cầu</label>
                <textarea
                  required
                  className="form-control"
                  rows="4"
                  value={form.instruction}
                  onChange={(e) => setForm({ ...form, instruction: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nội dung học sinh cần nói</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={form.promptText}
                  onChange={(e) => setForm({ ...form, promptText: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </form>
      <SaveBar
        formId="material-form"
        cancelTo={back.to}
        saving={state.saving}
        disabled={inUse}
        label="Lưu bài Speaking"
      />
    </main>
  );
}
