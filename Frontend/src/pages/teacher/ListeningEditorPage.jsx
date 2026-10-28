import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AudioPlayer from "../../components/common/AudioPlayer";
import { listeningApi } from "../../services/learningContentService";
import { listeningToForm } from "../../utils/editForms";
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
import AddButton from "../../components/material-view/AddButton";
import McqEditor, { blankQuestion } from "../../components/material-view/McqEditor";
import EditGate from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";
const question = blankQuestion;
const blank = () => ({
  courseId: "",
  courseWeekId: "",
  lessonId: "",
  title: "",
  description: "",
  instruction: "",
  audioUrl: "",
  questions: [question()],
});
export default function ListeningEditorPage({ mode: routeMode }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  // Sửa thông tin (/edit) và sửa nội dung (/content) là hai trang; tạo mới có cả hai phần.
  const mode = editing ? routeMode || "info" : "all";
  const info = mode !== "content";
  const body = mode !== "info";
  const ctx = materialContext(params);
  const back = editing
    ? { to: teacherMaterialView("LISTENING", id, ctx), label: "Quay lại xem" }
    : { to: materialExitLink("LISTENING", ctx), label: "Quay lại" };
  const edit = useEditForm(async () => {
    const d = editing ? await listeningApi.teacherGet(id) : null;
    const { courses, weeks, placement } = await loadPlacement(d, params);
    const form = d ? listeningToForm(d, placement.courseId) : { ...blank(), ...placement };
    if (!form.questions.length) form.questions = [question()];
    return { courses, weeks, name: d?.title, inUse: Boolean(d?.inUse), form };
  }, [id]);
  const { form, setForm } = edit;
  const { courses = [], weeks = [], inUse = false } = edit.extra;
  const setWeeks = (list) => edit.setExtra({ weeks: list });
  const [state, setState] = useState({ saving: false, uploading: false, error: "" });
  const release = useUnsavedGuard(edit.dirty);
  async function chooseCourse(v) {
    setForm((f) => ({ ...f, courseId: v, courseWeekId: "", lessonId: "" }));
    setWeeks(v ? await getTeacherCurriculum(v) : []);
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState((s) => ({ ...s, uploading: true, error: "" }));
    try {
      const r = await listeningApi.uploadAudio(file);
      setForm((f) => ({ ...f, audioUrl: r.url }));
      setState((s) => ({ ...s, uploading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        uploading: false,
        error: err.response?.data?.message || "Không thể tải âm thanh",
      }));
    }
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
        instruction: form.instruction,
        audioUrl: form.audioUrl,
        questions: form.questions,
      };
      const saved = editing
        ? await listeningApi.teacherUpdate(id, payload)
        : await listeningApi.teacherCreate(payload);
      release();
      nav(teacherMaterialView("LISTENING", saved.id ?? id, ctx), { replace: true });
    } catch (err) {
      setState((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.message || "Không thể lưu bài nghe",
      }));
    }
  }
  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <EditHeader title={editorTitle(mode, edit.extra.name, "Tạo bài Listening")} back={back} />
      {inUse && (
        <div className="alert alert-warning">
          Bài Listening đã có học viên nộp nên không thể sửa nội dung. Hãy tạo bài mới nếu cần thay
          đổi.
        </div>
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form id="material-form" className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
          {info && (
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
              <div className={body ? "col-md-6" : "col-12"}>
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </>
          )}
          {body && (
            <>
              <div className={info ? "col-md-6" : "col-12"}>
                <label className="form-label">Hướng dẫn</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.instruction}
                  onChange={(e) => setForm({ ...form, instruction: e.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label">File âm thanh</label>
                <input className="form-control" type="file" accept="audio/*" onChange={upload} />
                {state.uploading && <small>Đang tải lên…</small>}
                {form.audioUrl && (
                  <div className="mt-2">
                    <AudioPlayer
                      endpoint={"/media/listening?url=" + encodeURIComponent(form.audioUrl)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {body && (
          <>
            <hr className="my-4" />
            <McqEditor
              questions={form.questions}
              onChange={(questions) => setForm((f) => ({ ...f, questions }))}
            />
          </>
        )}
      </form>
      {/* Nút thêm đứng riêng, tách khỏi khung câu hỏi. */}
      {body && (
        <AddButton
          label="Thêm câu hỏi"
          onClick={() => setForm({ ...form, questions: [...form.questions, question()] })}
        />
      )}
      <SaveBar
        formId="material-form"
        cancelTo={back.to}
        saving={state.saving}
        disabled={state.uploading || inUse}
        label="Lưu bài nghe"
      />
    </main>
  );
}
