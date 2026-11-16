import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AudioPlayer from "../../components/common/AudioPlayer";
import { listeningApi } from "../../services/learningContentService";
import { listeningToForm } from "../../utils/editForms";
import { getTeacherCurriculum } from "../../services/courseService";
import { loadPlacement } from "../../utils/teacherPlacement";
import { useReturnTo } from "../../utils/useReturnTo";
import LessonPlacement from "../../components/course/LessonPlacement";
import EditGate, { editTitle } from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";
const option = (text = "", correct = false) => ({ optionText: text, correct });
const question = () => ({
  questionText: "",
  options: [option("", true), option(), option(), option()],
});
const blank = () => ({
  courseId: "",
  courseWeekId: "",
  lessonId: "",
  title: "",
  description: "",
  instruction: "",
  audioUrl: "",
  transcript: "",
  questions: [question()],
});
export default function ListeningEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  const back = useReturnTo("/teacher/library?type=LISTENING", "Thư viện học liệu");
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
  async function chooseCourse(v) {
    setForm((f) => ({ ...f, courseId: v, courseWeekId: "", lessonId: "" }));
    setWeeks(v ? await getTeacherCurriculum(v) : []);
  }
  function patchQ(i, k, v) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, n) => (n === i ? { ...q, [k]: v } : q)),
    }));
  }
  function patchO(qi, oi, key, value) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, n) =>
        n !== qi
          ? q
          : {
              ...q,
              options: q.options.map((o, m) =>
                m === oi
                  ? { ...o, [key]: value }
                  : key === "correct" && value
                    ? { ...o, correct: false }
                    : o,
              ),
            },
      ),
    }));
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
        transcript: form.transcript,
        questions: form.questions,
      };
      const saved = editing
        ? await listeningApi.teacherUpdate(id, payload)
        : await listeningApi.teacherCreate(payload);
      nav(back.to);
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
      <PageHeader
        crumbs={[back]}
        title={editTitle(editing, edit.extra.name, "Tạo bài Listening")}
      />
      {inUse && (
        <div className="alert alert-warning">
          Bài Listening đã có học viên nộp nên không thể sửa nội dung. Hãy tạo bài mới nếu cần thay
          đổi.
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
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-control"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="col-md-6">
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
          <div className="col-12">
            <label className="form-label" htmlFor="listening-transcript">
              Transcript
            </label>
            <textarea
              id="listening-transcript"
              className="form-control font-monospace"
              rows="8"
              maxLength={20000}
              value={form.transcript}
              onChange={(e) => setForm({ ...form, transcript: e.target.value })}
              placeholder={
                "[W-US] Hi Tom, did you get the budget report? {1}\n[M-UK] Yes, but the Osaka figures are missing. {2}"
              }
              aria-describedby="listening-transcript-help"
            />
            <small id="listening-transcript-help" className="form-text">
              Mỗi dòng một lượt nói, mở đầu bằng mã giọng: M/W (nam/nữ) + US/UK/AU/CA, ví dụ [W-US],
              [M-UK]. Thêm {"{1}"}, {"{2}"}… cuối câu chứa đáp án của câu hỏi tương ứng để học viên
              thấy câu đó được đánh dấu. Học viên chỉ xem transcript sau khi nộp bài. Sửa transcript
              không tự đổi file âm thanh.
            </small>
          </div>
        </div>
        <hr className="my-4" />
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="h5 fw-bold">Câu hỏi ({form.questions.length})</h2>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setForm({ ...form, questions: [...form.questions, question()] })}
          >
            + Thêm câu
          </button>
        </div>
        {form.questions.map((q, qi) => (
          <div className="border rounded-3 p-3 mt-3" key={qi}>
            <div className="d-flex gap-2">
              <input
                required
                className="form-control"
                placeholder={`Câu ${qi + 1}`}
                value={q.questionText}
                onChange={(e) => patchQ(qi, "questionText", e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                disabled={form.questions.length === 1}
                onClick={() =>
                  setForm((f) => ({ ...f, questions: f.questions.filter((_, n) => n !== qi) }))
                }
              >
                Xóa
              </button>
            </div>
            <div className="row g-2 mt-1">
              {q.options.map((o, oi) => (
                <div className="col-md-6" key={oi}>
                  <div className="input-group">
                    <span className="input-group-text">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={o.correct}
                        onChange={() => patchO(qi, oi, "correct", true)}
                      />
                    </span>
                    <input
                      required
                      className="form-control"
                      value={o.optionText}
                      onChange={(e) => patchO(qi, oi, "optionText", e.target.value)}
                      placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Link className="btn btn-link" to={back.to}>
            Hủy
          </Link>
          <button className="btn btn-primary" disabled={state.saving || state.uploading || inUse}>
            {state.saving ? "Đang lưu…" : "Lưu bài nghe"}
          </button>
        </div>
      </form>
    </main>
  );
}
