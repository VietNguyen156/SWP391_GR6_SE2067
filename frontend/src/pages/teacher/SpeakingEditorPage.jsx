import AudioPlayer from "../../components/common/AudioPlayer";
import PageHeader from "../../components/common/PageHeader";
import { useSuccessToast } from "../../components/common/Toast";
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { speakingApi } from "../../services/learningContentService";
import { speakingToForm } from "../../utils/editForms";
import { getTeacherCurriculum } from "../../services/courseService";
import { loadPlacement } from "../../utils/teacherPlacement";
import { useReturnTo } from "../../utils/useReturnTo";
import LessonPlacement from "../../components/course/LessonPlacement";
import EditGate, { editTitle } from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";
const blank = {
  courseId: "",
  courseWeekId: "",
  lessonId: "",
  title: "",
  instruction: "",
  promptText: "",
};
const statusText = (v) => ({ SUBMITTED: "Đã nộp", GRADED: "Đã chấm" })[v] || v;
export default function SpeakingEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  const back = useReturnTo("/teacher/library?type=SPEAKING", "Thư viện học liệu");
  const edit = useEditForm(async () => {
    const d = editing ? await speakingApi.teacherGet(id) : null;
    const { courses, weeks, placement } = await loadPlacement(d, params);
    return {
      courses,
      weeks,
      name: d?.title,
      inUse: Boolean(d?.inUse),
      subs: editing ? await speakingApi.submissions(id) : [],
      form: d ? speakingToForm(d, placement.courseId) : { ...blank, ...placement },
    };
  }, [id]);
  const { form, setForm } = edit;
  const { courses = [], weeks = [], inUse = false, subs = [] } = edit.extra;
  const setWeeks = (list) => edit.setExtra({ weeks: list });
  const setSubs = (list) => edit.setExtra({ subs: list });
  const [state, setState] = useState({ saving: false, error: "", message: "" });
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
      const p = {
        courseWeekId: Number(form.courseWeekId),
        lessonId: form.lessonId ? Number(form.lessonId) : null,
        title: form.title,
        instruction: form.instruction,
        promptText: form.promptText,
      };
      if (editing) await speakingApi.teacherUpdate(id, p);
      else await speakingApi.teacherCreate(p);
      nav(back.to);
    } catch (err) {
      setState((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.message || "Không thể lưu",
      }));
    }
  }
  async function grade(subId) {
    const score = document.getElementById(`score-${subId}`).value,
      feedback = document.getElementById(`feedback-${subId}`).value;
    const n = Number(score);
    if (score === "" || n < 0 || n > 100) {
      setState((s) => ({ ...s, error: "Điểm Speaking phải từ 0 đến 100" }));
      return;
    }
    try {
      await speakingApi.grade(subId, { score: n, feedback });
      setSubs(await speakingApi.submissions(id));
      setState((s) => ({ ...s, error: "", message: "Đã lưu điểm" }));
    } catch (e) {
      setState((s) => ({ ...s, error: e.response?.data?.message || "Không thể chấm bài" }));
    }
  }
  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <PageHeader crumbs={[back]} title={editTitle(editing, edit.extra.name, "Tạo bài Speaking")} />
      {inUse && (
        <div className="alert alert-warning">
          Bài Speaking đã có học viên nộp nên không thể sửa nội dung. Bạn vẫn chấm bài bên dưới bình
          thường.
        </div>
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
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
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Link className="btn btn-link" to={back.to}>
            Hủy
          </Link>
          <button className="btn btn-primary" disabled={state.saving || inUse}>
            {state.saving ? "Đang lưu…" : "Lưu bài Speaking"}
          </button>
        </div>
      </form>
      {editing && (
        <section className="teacher-panel p-4 mt-4">
          <h2 className="h5 fw-bold">Bài nộp của học sinh</h2>
          {!subs.length && <p className="text-secondary">Chưa có học sinh nộp bài.</p>}
          {subs.map((s) => (
            <div className="border rounded-3 p-3 mb-3" key={s.id}>
              <div className="d-flex justify-content-between">
                <strong>{s.studentName}</strong>
                <span>{statusText(s.status)}</span>
              </div>
              <AudioPlayer endpoint={`/teacher/speaking/submissions/${s.id}/audio`} />
              <div className="row g-2">
                <div className="col-md-3">
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={s.score ?? ""}
                    placeholder="Điểm"
                    id={`score-${s.id}`}
                  />
                </div>
                <div className="col-md-6">
                  <input
                    className="form-control"
                    defaultValue={s.feedback || ""}
                    placeholder="Nhận xét"
                    id={`feedback-${s.id}`}
                  />
                </div>
                <div className="col-md-3">
                  <button className="btn btn-primary w-100" onClick={() => grade(s.id)}>
                    Lưu chấm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
