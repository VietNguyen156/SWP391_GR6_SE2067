import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AudioPlayer from "../../components/common/AudioPlayer";
import EditGate from "../../components/common/EditGate";
import AttachmentManager, { uploadDrafts } from "../../components/grammar/AttachmentManager";
import AddButton from "../../components/material-view/AddButton";
import { EditHeader, SaveBar } from "../../components/material-view/EditFrame";
import McqEditor, { blankQuestion } from "../../components/material-view/McqEditor";
import McqFileImport from "../../components/material-view/McqFileImport";
import { testBankApi } from "../../services/testBankService";
import { FILE_TYPES } from "../../utils/attachments";
import useEditForm from "../../utils/useEditForm";
import useUnsavedGuard from "../../utils/useUnsavedGuard";
import { PassageEditor } from "./ReadingEditorPage";

const NONE = [];
const BACK = (type) => ({ to: `/teacher/questions?tab=${type}`, label: "Ngân hàng đề thi" });
const EMPTY = "Bài Đọc cần có đoạn văn hoặc ít nhất một tệp đính kèm.";

const TITLES = {
  listening: ["Tạo bài Nghe", "Sửa bài Nghe"],
  reading: ["Tạo bài Đọc", "Sửa bài Đọc"],
  speaking: ["Tạo đề Nói", "Sửa đề Nói"],
};

const blank = {
  listening: () => ({ title: "", instruction: "", audioUrl: "", questions: [blankQuestion()] }),
  reading: () => ({
    title: "",
    instruction: "",
    passage: "",
    passageFormat: "MARKDOWN",
    toeicPart: "PART_7",
    passageType: "SINGLE",
    questions: [blankQuestion()],
  }),
  speaking: () => ({ title: "", instruction: "", promptText: "" }),
};

const text = (v) => (v == null ? "" : String(v));

function toForm(type, item) {
  if (type === "speaking")
    return {
      title: text(item.title),
      instruction: text(item.instruction),
      promptText: text(item.promptText),
    };
  const questions = (item.questions || []).map((q) => ({
    questionText: text(q.questionText),
    explanation: text(q.explanation),
    evidence: text(q.evidence),
    options: (q.options || []).map((o) => ({
      optionText: text(o.optionText),
      correct: Boolean(o.correct),
    })),
  }));
  const form = {
    title: text(item.title),
    instruction: text(item.instruction),
    questions: questions.length ? questions : [blankQuestion()],
  };
  if (type === "listening") return { ...form, audioUrl: text(item.audioUrl) };
  return {
    ...form,
    passage: text(item.passage),
    passageFormat: item.passageFormat || "MARKDOWN",
    toeicPart: item.toeicPart || "PART_7",
    passageType: item.passageType || "SINGLE",
  };
}

/**
 * Tạo/sửa một mục của Ngân hàng đề thi (Nghe, Đọc, Nói). Không chọn khóa học/tuần/bài:
 * nội dung này chỉ dùng để dựng Test cuối khóa.
 */
export default function TestBankEditorPage() {
  const { type, id } = useParams();
  const api = testBankApi[type];
  const nav = useNavigate();
  const editing = Boolean(id);
  const back = BACK(type);
  const edit = useEditForm(async () => {
    const item = editing ? await api.get(id) : null;
    return {
      name: item?.title,
      usedBy: item?.usedBy || 0,
      attachments: item?.attachments || [],
      form: item ? toForm(type, item) : blank[type](),
    };
  }, [type, id]);
  const { form, setForm } = edit;
  const { usedBy = 0, attachments = NONE } = edit.extra;
  // Đang sửa: tệp thật trên máy chủ. Tạo mới: giữ tạm, tải lên sau khi lưu bài.
  const [files, setFiles] = useState(null);
  const [state, setState] = useState({ saving: false, uploading: false, error: "" });
  const release = useUnsavedGuard(edit.dirty || (!editing && Boolean(files?.length)));
  const currentFiles = files ?? attachments;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  if (!api) return <main className="container py-5">Loại nội dung không hợp lệ.</main>;

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState((s) => ({ ...s, uploading: true, error: "" }));
    try {
      const r = await api.uploadAudio(file);
      set({ audioUrl: r.url });
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
    if (type === "reading" && !form.passage.trim() && !currentFiles.length) {
      setState((s) => ({ ...s, error: EMPTY }));
      return;
    }
    setState((s) => ({ ...s, saving: true, error: "" }));
    try {
      const saved = editing ? await api.update(id, form) : await api.create(form);
      let failed = [];
      if (type === "reading" && !editing && currentFiles.length) {
        failed = await uploadDrafts(saved.id, currentFiles, api);
        // Bài chỉ có tệp: đưa vào danh sách chọn sau khi tải xong (backend kiểm tra lại).
        if (saved.status !== "ACTIVE" && failed.length < currentFiles.length)
          await api.publish(saved.id);
      }
      release();
      if (failed.length) {
        setState({
          saving: false,
          uploading: false,
          error: `Đã lưu bài nhưng chưa tải được: ${failed.join(", ")}. Mở bài để thêm lại.`,
        });
        nav(`/teacher/test-bank/${type}/${saved.id}/edit`, { replace: true });
        return;
      }
      nav(back.to, { replace: true });
    } catch (err) {
      setState((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.message || "Không thể lưu",
      }));
    }
  }

  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  const [createTitle, editTitle] = TITLES[type];
  const multi = form.passageType && form.passageType !== "SINGLE";
  return (
    <main className="container py-5 content-shell">
      <EditHeader
        title={editing ? `${editTitle}: ${edit.extra.name || "…"}` : createTitle}
        back={back}
      />
      {usedBy > 0 && (
        <div className="alert alert-info">
          Mục này đang được dùng trong {usedBy} phần Test. Sửa nội dung chỉ áp dụng cho phiên bản đề
          xuất bản sau; các Test đã xuất bản và kết quả cũ giữ nguyên.
        </div>
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form id="test-bank-form" className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label" htmlFor="tb-title">
              Tên
            </label>
            <input
              id="tb-title"
              required
              maxLength={200}
              className="form-control"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </div>
          {type === "speaking" ? (
            <>
              <div className="col-md-6">
                <label className="form-label" htmlFor="tb-instruction">
                  Yêu cầu
                </label>
                <textarea
                  id="tb-instruction"
                  required
                  className="form-control"
                  rows="4"
                  value={form.instruction}
                  onChange={(e) => set({ instruction: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="tb-prompt">
                  Nội dung học viên cần nói
                </label>
                <textarea
                  id="tb-prompt"
                  className="form-control"
                  rows="4"
                  value={form.promptText}
                  onChange={(e) => set({ promptText: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div className="col-12">
              <label className="form-label" htmlFor="tb-instruction">
                Hướng dẫn
              </label>
              <textarea
                id="tb-instruction"
                className="form-control"
                rows="2"
                value={form.instruction}
                onChange={(e) => set({ instruction: e.target.value })}
              />
            </div>
          )}
          {type === "listening" && (
            <div className="col-12">
              <label className="form-label" htmlFor="tb-audio">
                File âm thanh
              </label>
              <input
                id="tb-audio"
                className="form-control"
                type="file"
                accept="audio/*"
                onChange={upload}
              />
              {state.uploading && <small>Đang tải lên…</small>}
              {form.audioUrl && (
                <div className="mt-2">
                  <AudioPlayer
                    endpoint={"/media/listening?url=" + encodeURIComponent(form.audioUrl)}
                  />
                </div>
              )}
            </div>
          )}
          {type === "reading" && (
            <>
              <div className="col-md-6">
                <label className="form-label" htmlFor="tb-part">
                  Phần TOEIC
                </label>
                <select
                  id="tb-part"
                  className="form-select"
                  value={form.toeicPart}
                  onChange={(e) => set({ toeicPart: e.target.value })}
                >
                  <option value="PART_6">Part 6 — Điền vào đoạn văn</option>
                  <option value="PART_7">Part 7 — Đọc hiểu</option>
                  <option value="GENERAL">Đọc hiểu chung</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="tb-type">
                  Số văn bản
                </label>
                <select
                  id="tb-type"
                  className="form-select"
                  value={form.passageType}
                  onChange={(e) => set({ passageType: e.target.value })}
                >
                  <option value="SINGLE">Một văn bản</option>
                  <option value="DOUBLE">Hai văn bản</option>
                  <option value="TRIPLE">Ba văn bản</option>
                </select>
              </div>
              <div className="col-12">
                <span className="form-label d-block">Đoạn văn</span>
                <PassageEditor
                  value={form.passage}
                  onChange={(passage) => set({ passage })}
                  format={form.passageFormat}
                  onFormat={(passageFormat) => set({ passageFormat })}
                  multi={multi}
                />
              </div>
              <div className="col-12">
                <AttachmentManager
                  contentId={editing ? Number(id) : null}
                  attachments={attachments}
                  onChange={setFiles}
                  embedded
                  api={api}
                  types={FILE_TYPES.READING}
                  allowLinks={false}
                  label="Tệp đính kèm của bài đọc"
                  heading="Tệp đính kèm"
                />
              </div>
            </>
          )}
        </div>
        {type !== "speaking" && (
          <>
            <hr className="my-4" />
            <McqFileImport
              questions={form.questions}
              onChange={(questions) => set({ questions })}
              kind={type}
            />
            <McqEditor
              questions={form.questions}
              onChange={(questions) => set({ questions })}
              withKey={type === "reading"}
            />
          </>
        )}
      </form>
      {type !== "speaking" && (
        <AddButton
          label="Thêm câu hỏi"
          onClick={() => set({ questions: [...form.questions, blankQuestion()] })}
        />
      )}
      <SaveBar
        formId="test-bank-form"
        cancelTo={back.to}
        saving={state.saving}
        disabled={state.uploading}
        label="Lưu vào ngân hàng"
      />
    </main>
  );
}
