import { useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import EditGate from "../../components/common/EditGate";
import LessonPlacement from "../../components/course/LessonPlacement";
import AttachmentList from "../../components/grammar/AttachmentList";
import AttachmentManager, { uploadDrafts } from "../../components/grammar/AttachmentManager";
import AddButton from "../../components/material-view/AddButton";
import { EditHeader, SaveBar, editorTitle } from "../../components/material-view/EditFrame";
import McqEditor, { blankQuestion } from "../../components/material-view/McqEditor";
import ReadingQuestionImporter from "../../components/material-view/ReadingQuestionImporter";
import Passage from "../../components/reading/Passage";
import { getTeacherCurriculum } from "../../services/courseService";
import { readingApi } from "../../services/learningContentService";
import { FILE_TYPES } from "../../utils/attachments";
import { readingToForm } from "../../utils/editForms";
import {
  materialContext,
  materialExitLink,
  teacherMaterialView,
} from "../../utils/lessonMaterials";
import { loadPlacement } from "../../utils/teacherPlacement";
import useEditForm from "../../utils/useEditForm";
import useUnsavedGuard from "../../utils/useUnsavedGuard";

const NONE = [];
const EMPTY = "Bài Reading cần có đoạn văn hoặc ít nhất một tệp đính kèm.";

const blank = () => ({
  courseId: "",
  courseWeekId: "",
  lessonId: "",
  title: "",
  description: "",
  instruction: "",
  passage: "",
  passageFormat: "MARKDOWN",
  toeicPart: "PART_7",
  passageType: "SINGLE",
  questions: [blankQuestion()],
});

/** Thanh định dạng: bọc vùng chọn (**đậm**, *nghiêng*) hoặc thêm tiền tố cho từng dòng (##, -). */
export function PassageEditor({ value, onChange, format, onFormat, multi }) {
  const area = useRef(null);
  const [preview, setPreview] = useState(false);

  function apply(kind) {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    let next;
    let caret;
    if (kind === "bold" || kind === "italic") {
      const mark = kind === "bold" ? "**" : "*";
      const picked = value.slice(start, end) || (kind === "bold" ? "chữ đậm" : "chữ nghiêng");
      next = value.slice(0, start) + mark + picked + mark + value.slice(end);
      caret = [start + mark.length, start + mark.length + picked.length];
    } else {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const prefix = kind === "heading" ? "## " : "- ";
      const lines = value.slice(lineStart, end).split("\n");
      const block = lines.map((l) => (l.startsWith(prefix) ? l : prefix + l)).join("\n");
      next = value.slice(0, lineStart) + block + value.slice(end);
      caret = [lineStart, lineStart + block.length];
    }
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(...caret);
    });
  }

  const markdown = format === "MARKDOWN";
  const tools = [
    ["bold", "B", "Chữ đậm"],
    ["italic", "I", "Chữ nghiêng"],
    ["heading", "H", "Tiêu đề (tách văn bản)"],
    ["list", "•", "Danh sách"],
  ];
  return (
    <div className="rp-editor">
      <div className="rp-editor-bar">
        <div className="rp-editor-tabs" role="tablist" aria-label="Đoạn văn">
          <button
            type="button"
            role="tab"
            aria-selected={!preview}
            className={!preview ? "is-active" : ""}
            onClick={() => setPreview(false)}
          >
            Soạn
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={preview}
            className={preview ? "is-active" : ""}
            onClick={() => setPreview(true)}
          >
            Xem trước
          </button>
        </div>
        {!preview && markdown && (
          <div className="rp-tools" role="toolbar" aria-label="Định dạng đoạn văn">
            {tools.map(([kind, label, title]) => (
              <button
                key={kind}
                type="button"
                className={`btn btn-sm btn-light rp-tool-${kind}`}
                title={title}
                aria-label={title}
                onClick={() => apply(kind)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <select
          className="form-select form-select-sm rp-format"
          aria-label="Định dạng"
          value={format}
          onChange={(e) => onFormat(e.target.value)}
        >
          <option value="MARKDOWN">Markdown</option>
          <option value="PLAIN">Văn bản thường</option>
        </select>
      </div>
      {preview ? (
        <div className="rp-editor-preview">
          {value.trim() ? (
            <Passage passage={value} format={format} multi={multi} />
          ) : (
            <p className="mv-empty">Chưa có đoạn văn.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={area}
          className="form-control rp-editor-input"
          rows="14"
          aria-label="Đoạn văn"
          placeholder={
            multi
              ? "## E-mail\nDear Ms. Tran, ...\n\n## Schedule\n| Day | Time |\n|---|---|\n| Mon | 9 a.m. |"
              : "Dán hoặc gõ đoạn văn. Dùng **đậm**, *nghiêng*, ## tiêu đề, - danh sách, | bảng |."
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function ReadingEditorPage({ mode: routeMode }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const editing = Boolean(id);
  // Sửa thông tin (/edit) và sửa nội dung (/content) là hai trang; tạo mới có cả hai phần.
  const mode = editing ? routeMode || "info" : "all";
  const info = mode !== "content";
  const body = mode !== "info";
  const ctx = materialContext(params);
  const back = editing
    ? { to: teacherMaterialView("READING", id, ctx), label: "Quay lại xem" }
    : { to: materialExitLink("READING", ctx), label: "Quay lại" };
  const edit = useEditForm(async () => {
    const d = editing ? await readingApi.teacherGet(id) : null;
    const { courses, weeks, placement } = await loadPlacement(d, params);
    const form = d ? readingToForm(d, placement.courseId) : { ...blank(), ...placement };
    if (!form.questions.length) form.questions = [blankQuestion()];
    return {
      courses,
      weeks,
      name: d?.title,
      inUse: Boolean(d?.inUse),
      attachments: d?.attachments || [],
      form,
    };
  }, [id]);
  const { form, setForm } = edit;
  const { courses = [], weeks = [], inUse = false, attachments = NONE } = edit.extra;
  const setWeeks = (list) => edit.setExtra({ weeks: list });
  // Đang sửa: danh sách tệp thật trên máy chủ. Tạo mới: tệp giữ tạm, tải lên sau khi lưu bài.
  const [files, setFiles] = useState(null);
  const [state, setState] = useState({ saving: false, error: "" });
  const release = useUnsavedGuard(edit.dirty || (!editing && Boolean(files?.length)));
  const currentFiles = files ?? attachments;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function chooseCourse(v) {
    set({ courseId: v, courseWeekId: "", lessonId: "" });
    setWeeks(v ? await getTeacherCurriculum(v) : []);
  }

  function appendImportedQuestions(imported) {
    const current = form.questions || [];
    const hasOnlyEmptyStarter =
      current.length === 1 &&
      !current[0].questionText.trim() &&
      !current[0].explanation?.trim() &&
      !current[0].evidence?.trim() &&
      current[0].options.every((option) => !option.optionText.trim());
    set({ questions: [...(hasOnlyEmptyStarter ? [] : current), ...imported] });
  }

  async function save(e) {
    e.preventDefault();
    if (!form.courseWeekId || !form.lessonId) {
      setState({ saving: false, error: "Vui lòng chọn đầy đủ khóa học, tuần và bài học" });
      return;
    }
    if (body && !form.passage.trim() && !currentFiles.length) {
      setState({ saving: false, error: EMPTY });
      return;
    }
    setState({ saving: true, error: "" });
    try {
      const payload = {
        courseWeekId: Number(form.courseWeekId),
        lessonId: Number(form.lessonId),
        title: form.title,
        description: form.description,
        instruction: form.instruction,
        passage: form.passage,
        passageFormat: form.passageFormat,
        toeicPart: form.toeicPart,
        passageType: form.passageType,
        questions: form.questions,
      };
      const saved = editing
        ? await readingApi.teacherUpdate(id, payload)
        : await readingApi.teacherCreate(payload);
      let failed = [];
      if (!editing && currentFiles.length) {
        failed = await uploadDrafts(saved.id, currentFiles, readingApi);
        // Bài chỉ có tệp: hiển thị cho học viên sau khi tải xong (backend kiểm tra lại).
        if (saved.status !== "PUBLISHED" && failed.length < currentFiles.length)
          await readingApi.publish(saved.id);
      }
      release();
      if (failed.length) {
        setState({
          saving: false,
          error: `Đã lưu bài nhưng chưa tải được: ${failed.join(", ")}. Mở “Chỉnh sửa nội dung” để thêm lại.`,
        });
        nav(teacherMaterialView("READING", saved.id, ctx), { replace: true });
        return;
      }
      nav(teacherMaterialView("READING", saved.id ?? id, ctx), { replace: true });
    } catch (err) {
      setState({ saving: false, error: err.response?.data?.message || "Không thể lưu bài đọc" });
    }
  }

  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  const multi = form.passageType !== "SINGLE";
  return (
    <main className="container py-5 content-shell">
      <EditHeader title={editorTitle(mode, edit.extra.name, "Tạo bài Reading")} back={back} />
      {inUse && (
        <div className="alert alert-warning">
          Bài Reading đã có học viên nộp nên không thể sửa nội dung. Hãy tạo bài mới nếu cần thay
          đổi.
        </div>
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form id="material-form" className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
          {info && (
            <>
              <div className="col-12">
                <label className="form-label" htmlFor="reading-title">
                  Tên bài
                </label>
                <input
                  id="reading-title"
                  required
                  maxLength={200}
                  className="form-control"
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>
              <div className="col-12">
                <LessonPlacement
                  courses={courses}
                  weeks={weeks}
                  value={form}
                  onCourse={chooseCourse}
                  onChange={set}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="reading-part">
                  Phần TOEIC
                </label>
                <select
                  id="reading-part"
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
                <label className="form-label" htmlFor="reading-type">
                  Số văn bản
                </label>
                <select
                  id="reading-type"
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
                <label className="form-label" htmlFor="reading-desc">
                  Mô tả
                </label>
                <textarea
                  id="reading-desc"
                  className="form-control"
                  rows="2"
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>
            </>
          )}
          {body && (
            <>
              <div className="col-12">
                <label className="form-label" htmlFor="reading-instruction">
                  Hướng dẫn
                </label>
                <textarea
                  id="reading-instruction"
                  className="form-control"
                  rows="2"
                  placeholder="Ví dụ: Đọc e-mail và lịch trình, sau đó trả lời câu 1–5."
                  value={form.instruction}
                  onChange={(e) => set({ instruction: e.target.value })}
                />
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
                {inUse ? (
                  <AttachmentList attachments={attachments} api={readingApi} title="Tệp đính kèm" />
                ) : (
                  <AttachmentManager
                    contentId={editing ? Number(id) : null}
                    attachments={attachments}
                    onChange={setFiles}
                    embedded
                    api={readingApi}
                    types={FILE_TYPES.READING}
                    allowLinks={false}
                    label="Tệp đính kèm của bài đọc"
                    heading="Tệp đính kèm"
                  />
                )}
              </div>
            </>
          )}
        </div>
        {body && (
          <>
            <hr className="my-4" />
            <ReadingQuestionImporter onImport={appendImportedQuestions} />
            <McqEditor
              questions={form.questions}
              onChange={(questions) => set({ questions })}
              withKey
            />
          </>
        )}
      </form>
      {body && (
        <AddButton
          label="Thêm câu hỏi"
          onClick={() => set({ questions: [...form.questions, blankQuestion()] })}
        />
      )}
      <SaveBar
        formId="material-form"
        cancelTo={back.to}
        saving={state.saving}
        disabled={inUse}
        label="Lưu bài đọc"
      />
    </main>
  );
}
