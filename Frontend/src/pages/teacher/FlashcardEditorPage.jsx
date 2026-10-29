import { useState } from "react";
import { enumLabel } from "../../utils/statusLabels";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { flashcardApi } from "../../services/learningContentService";
import { flashcardSetToForm } from "../../utils/editForms";
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
import FlashcardFileImport from "../../components/material-view/FlashcardFileImport";
import EditGate from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";
const card = () => ({
  frontText: "",
  backText: "",
  pronunciation: "",
  wordType: "",
  exampleSentence: "",
  imageUrl: "",
  audioUrl: "",
});
const blank = () => ({
  courseId: "",
  courseWeekId: "",
  lessonId: "",
  title: "",
  description: "",
  topic: "",
  toeicPart: "GENERAL",
  difficulty: "MEDIUM",
  cards: [card()],
});
export default function FlashcardEditorPage({ mode: routeMode }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate(),
    editing = Boolean(id);
  // Sửa thông tin (/edit) và sửa thẻ (/content) là hai trang; tạo mới có cả hai phần.
  const mode = editing ? routeMode || "info" : "all";
  const ctx = materialContext(params);
  const back = editing
    ? { to: teacherMaterialView("FLASHCARD", id, ctx), label: "Quay lại xem" }
    : { to: materialExitLink("FLASHCARD", ctx), label: "Quay lại" };
  const edit = useEditForm(async () => {
    const d = editing ? await flashcardApi.teacherGet(id) : null;
    const { courses, weeks, placement } = await loadPlacement(d, params);
    const form = d ? flashcardSetToForm(d, placement.courseId) : { ...blank(), ...placement };
    if (!form.cards.length) form.cards = [card()];
    return { courses, weeks, name: d?.title, form };
  }, [id]);
  const { form, setForm } = edit;
  const { courses = [], weeks = [] } = edit.extra;
  const setWeeks = (list) => edit.setExtra({ weeks: list });
  const [state, setState] = useState({ saving: false, error: "" });
  const [added, setAdded] = useState(null); // thẻ vừa thêm: mở sẵn để nhập ngay
  const release = useUnsavedGuard(edit.dirty);
  async function chooseCourse(v) {
    setForm((f) => ({ ...f, courseId: v, courseWeekId: "", lessonId: "" }));
    setWeeks(v ? await getTeacherCurriculum(v) : []);
  }
  function patch(i, k, v) {
    setForm((f) => ({ ...f, cards: f.cards.map((x, n) => (n === i ? { ...x, [k]: v } : x)) }));
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
        topic: form.topic,
        toeicPart: form.toeicPart,
        difficulty: form.difficulty,
        cards: form.cards.map((x, i) => ({ ...x, sortOrder: i + 1 })),
      };
      const saved = editing
        ? await flashcardApi.teacherUpdate(id, payload)
        : await flashcardApi.teacherCreate(payload);
      release();
      nav(teacherMaterialView("FLASHCARD", saved.id ?? id, ctx), { replace: true });
    } catch (err) {
      setState((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.message || "Không thể lưu bộ thẻ",
      }));
    }
  }
  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <EditHeader title={editorTitle(mode, edit.extra.name, "Tạo bộ Flashcards")} back={back} />
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form id="material-form" onSubmit={save}>
        {mode !== "content" && (
          <section className="teacher-panel p-4 mb-3">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Tên bộ thẻ</label>
                <input
                  required
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Chủ đề</label>
                <input
                  className="form-control"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <label className="form-label">TOEIC Part</label>
                <select
                  className="form-select"
                  value={form.toeicPart}
                  onChange={(e) => setForm({ ...form, toeicPart: e.target.value })}
                >
                  {[
                    "GENERAL",
                    "PART_1",
                    "PART_2",
                    "PART_3",
                    "PART_4",
                    "PART_5",
                    "PART_6",
                    "PART_7",
                  ].map((x) => (
                    <option key={x} value={x}>
                      {enumLabel(x)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Độ khó</label>
                <select
                  className="form-select"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  {["BEGINNER", "EASY", "MEDIUM", "HARD", "ADVANCED"].map((x) => (
                    <option key={x} value={x}>
                      {enumLabel(x)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}
        {mode !== "info" && (
          <>
            <section className="teacher-panel p-4 teacher-flashcard-list">
              <h2 className="h5 fw-bold mb-3">Các thẻ ({form.cards.length})</h2>
              <FlashcardFileImport
                cards={form.cards}
                makeCard={card}
                onChange={(cards) => setForm((current) => ({ ...current, cards }))}
              />
              {form.cards.map((c, i) => (
                <details
                  className="teacher-collapsible mb-2"
                  key={c.id || i}
                  open={form.cards.length === 1 || i === added ? true : undefined}
                >
                  <summary>
                    <div>
                      <strong>Thẻ {i + 1}</strong>
                      <small>{c.frontText || "Chưa nhập mặt trước"}</small>
                    </div>
                  </summary>
                  <div className="teacher-collapsible-body row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Mặt trước</label>
                      <input
                        required
                        className="form-control fc-input-lg"
                        value={c.frontText}
                        onChange={(e) => patch(i, "frontText", e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Mặt sau</label>
                      <textarea
                        required
                        className="form-control fc-input-lg"
                        value={c.backText}
                        onChange={(e) => patch(i, "backText", e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Phát âm</label>
                      <input
                        className="form-control"
                        value={c.pronunciation || ""}
                        onChange={(e) => patch(i, "pronunciation", e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Loại từ</label>
                      <input
                        className="form-control"
                        value={c.wordType || ""}
                        onChange={(e) => patch(i, "wordType", e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Ví dụ</label>
                      <input
                        className="form-control"
                        value={c.exampleSentence || ""}
                        onChange={(e) => patch(i, "exampleSentence", e.target.value)}
                      />
                    </div>
                    <div className="col-12 text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={form.cards.length === 1}
                        onClick={() =>
                          setForm((f) => ({ ...f, cards: f.cards.filter((_, n) => n !== i) }))
                        }
                      >
                        Xóa thẻ
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </section>
            {/* Nút thêm đứng riêng, tách khỏi danh sách thẻ. */}
            <AddButton
              label="Thêm thẻ"
              onClick={() => {
                setAdded(form.cards.length);
                setForm({ ...form, cards: [...form.cards, card()] });
              }}
            />
          </>
        )}
      </form>
      <SaveBar formId="material-form" cancelTo={back.to} saving={state.saving} label="Lưu bộ thẻ" />
    </main>
  );
}
