import { useState } from "react";
import { enumLabel } from "../../utils/statusLabels";
import { useSuccessToast } from "../../components/common/Toast";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { grammarApi } from "../../services/learningContentService";
import { grammarToForm } from "../../utils/editForms";
import { getTeacherCurriculum } from "../../services/courseService";
import { loadPlacement } from "../../utils/teacherPlacement";
import {
  DoneBar,
  EditHeader,
  SaveBar,
  editorTitle,
} from "../../components/material-view/EditFrame";
import {
  materialContext,
  materialExitLink,
  teacherMaterialView,
} from "../../utils/lessonMaterials";
import useUnsavedGuard from "../../utils/useUnsavedGuard";
import LessonPlacement from "../../components/course/LessonPlacement";
import AttachmentManager, { uploadDrafts } from "../../components/grammar/AttachmentManager";
import AttachmentIcon from "../../components/grammar/AttachmentIcon";
import { attachmentMeta } from "../../utils/attachments";
import AddButton from "../../components/material-view/AddButton";
import EditGate from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";

const blank = {
  title: "",
  description: "",
  level: "BEGINNER",
  courseId: "",
  courseWeekId: "",
  lessonId: "",
};
const NONE = []; // hằng rỗng: tránh tạo mảng mới mỗi lần render
const emptyContent = { id: null, ruleContent: "", examples: "", notes: "", sortOrder: "" };
export default function GrammarEditorPage({ mode: routeMode }) {
  const confirm = useConfirm();
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  // Sửa thông tin (/edit) và sửa nội dung (/content) là hai trang; tạo mới có cả hai phần.
  const mode = editing ? routeMode || "info" : "all";
  const ctx = materialContext(params);
  const back = editing
    ? { to: teacherMaterialView("GRAMMAR", id, ctx), label: "Quay lại xem" }
    : { to: materialExitLink("GRAMMAR", ctx), label: "Quay lại" };
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
  // Form giải thích: null = đang đóng; mở khi bấm "+ Thêm giải thích" hoặc "Sửa" một phần.
  const [content, setContent] = useState(null);
  const [contentBase, setContentBase] = useState("");
  // Tài liệu chọn khi thêm giải thích mới: giữ tạm, tải lên sau khi lưu phần giải thích.
  const [drafts, setDrafts] = useState([]);
  function openContent(c) {
    const value = c
      ? {
          id: c.id,
          ruleContent: c.ruleContent || "",
          examples: c.examples || "",
          notes: c.notes || "",
          sortOrder: c.sortOrder,
        }
      : emptyContent;
    setContent(value);
    setContentBase(JSON.stringify(value));
    setDrafts([]);
  }
  const [state, setState] = useState({ saving: false, error: "", message: "" });
  useSuccessToast(state.message);
  const release = useUnsavedGuard(
    edit.dirty ||
      (content !== null && JSON.stringify(content) !== contentBase) ||
      drafts.length > 0,
  );
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
      release();
      nav(teacherMaterialView("GRAMMAR", saved.id, ctx), { replace: true });
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
      let failed = [];
      if (content.id) await grammarApi.updateContent(content.id, payload);
      else {
        const saved = await grammarApi.addContent(id, payload);
        failed = await uploadDrafts(saved.id, drafts);
      }
      setTopic(await grammarApi.teacherGet(id));
      setContent(null);
      setDrafts([]);
      setState((s) => ({
        ...s,
        saving: false,
        message: failed.length ? "" : "Đã lưu nội dung",
        error: failed.length
          ? `Đã lưu giải thích nhưng chưa tải được: ${failed.join(", ")}. Mở Sửa để thêm lại.`
          : "",
      }));
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
  const contentForm = content && (
    <form className="gc-form" onSubmit={saveContent}>
      <h3 className="h6 fw-bold">
        {content.id ? `Sửa phần ${content.sortOrder}` : "Thêm giải thích"}
      </h3>
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
      <AttachmentManager
        embedded
        contentId={content.id}
        label={content.id ? `Tài liệu đính kèm · Phần ${content.sortOrder}` : "Tài liệu đính kèm"}
        attachments={
          content.id
            ? topic?.contents?.find((x) => x.id === content.id)?.attachments || NONE
            : drafts
        }
        onChange={(attachments) =>
          content.id
            ? setTopic({
                ...topic,
                contents: topic.contents.map((x) =>
                  x.id === content.id ? { ...x, attachments } : x,
                ),
              })
            : setDrafts(attachments)
        }
      />
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setContent(null)}
        >
          Hủy
        </button>
        <button className="btn btn-primary" disabled={state.saving}>
          Lưu nội dung
        </button>
      </div>
    </form>
  );

  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <EditHeader title={editorTitle(mode, topic?.title, "Tạo chủ đề ngữ pháp")} back={back} />
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      {mode !== "content" && (
        <form id="material-form" className="teacher-panel p-4 mb-4" onSubmit={save}>
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
        </form>
      )}
      {mode === "content" && topic && (
        <>
          <section className="teacher-panel p-4 mb-4 gc-list" aria-label="Nội dung giải thích">
            <h2 className="h5 fw-bold mb-3">Nội dung giải thích ({topic.contents?.length || 0})</h2>
            {(topic.contents || []).map((c) => (
              <article className="gc-item" key={c.id}>
                {content?.id === c.id ? (
                  contentForm
                ) : (
                  <div className="admin-content-row">
                    <div>
                      <b>Phần {c.sortOrder}</b>
                      <p className="pre-line">{c.ruleContent}</p>
                    </div>
                    <div className="admin-content-actions">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openContent(c)}
                        disabled={content !== null}
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
                )}
                {content?.id !== c.id && c.attachments?.length > 0 && (
                  <ul className="gc-atts" aria-label={`Tài liệu của phần ${c.sortOrder}`}>
                    {c.attachments.map((x) => (
                      <li key={x.id}>
                        <AttachmentIcon attachment={x} />
                        <span>{x.title}</span>
                        <small>{attachmentMeta(x)}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
          {/* Nút / form thêm giải thích đứng riêng, tách khỏi danh sách các phần ở trên. */}
          {content && !content.id ? (
            <section className="teacher-panel p-4 mb-4" aria-label="Thêm giải thích">
              {contentForm}
            </section>
          ) : (
            <AddButton
              label="Thêm giải thích"
              onClick={() => openContent(null)}
              disabled={content !== null}
            />
          )}
        </>
      )}
      {mode === "content" ? (
        <DoneBar to={back.to} />
      ) : (
        <SaveBar
          formId="material-form"
          cancelTo={back.to}
          saving={state.saving}
          label="Lưu chủ đề"
        />
      )}
    </main>
  );
}
