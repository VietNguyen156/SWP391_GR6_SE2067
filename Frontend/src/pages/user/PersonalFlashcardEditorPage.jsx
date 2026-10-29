import { useState } from "react";
import EditGate, { editTitle } from "../../components/common/EditGate";
import { personalFlashcardToForm } from "../../utils/editForms";
import useEditForm from "../../utils/useEditForm";
import PageHeader from "../../components/common/PageHeader";
import { enumLabel } from "../../utils/statusLabels";
import { Link, useNavigate, useParams } from "react-router-dom";
import { flashcardApi } from "../../services/learningContentService";
import FlashcardFileImport from "../../components/material-view/FlashcardFileImport";

const emptyCard = () => ({
  id: null,
  frontText: "",
  backText: "",
  pronunciation: "",
  wordType: "",
  exampleSentence: "",
  imageUrl: "",
  audioUrl: "",
  sortOrder: null,
});

const emptySet = () => ({
  title: "",
  description: "",
  topic: "",
  toeicPart: "GENERAL",
  difficulty: "MEDIUM",
  cards: [emptyCard()],
});

export default function PersonalFlashcardEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const edit = useEditForm(async () => {
    if (!editing) return { form: emptySet() };
    const data = await flashcardApi.get(id);
    if (!data.personal) throw new Error("Bạn chỉ có thể chỉnh sửa bộ flashcard cá nhân của mình");
    const form = personalFlashcardToForm(data);
    if (!form.cards.length) form.cards = [emptyCard()];
    return { name: data.title, form };
  }, [id]);
  const { form, setForm } = edit;
  const [state, setState] = useState({ saving: false, error: "" });

  function updateCard(index, name, value) {
    setForm((current) => ({
      ...current,
      cards: current.cards.map((card, i) => (i === index ? { ...card, [name]: value } : card)),
    }));
  }

  async function save(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      const payload = {
        title: form.title,
        description: form.description,
        topic: form.topic,
        toeicPart: form.toeicPart,
        difficulty: form.difficulty,
        status: "PUBLISHED",
        cards: form.cards.map((card, index) => ({
          ...card,
          sortOrder: index + 1,
        })),
      };
      if (editing) await flashcardApi.personalUpdate(id, payload);
      else await flashcardApi.personalCreate(payload);
      navigate("/flashcards", { replace: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Không thể lưu bộ flashcard",
      }));
    }
  }

  if (!edit.ready) return <EditGate edit={edit} back={{ label: "Flashcard", to: "/flashcards" }} />;

  return (
    <main className="container py-5 content-shell">
      <PageHeader
        crumbs={[{ label: "Flashcard", to: "/flashcards" }]}
        title={editTitle(editing, edit.extra.name, "Tạo bộ flashcard mới")}
      />

      {state.error && <div className="alert alert-danger">{state.error}</div>}

      <form className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">Tên bộ</label>
            <input
              className="form-control"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Chủ đề</label>
            <input
              className="form-control"
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-control"
              rows="3"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">TOEIC Part</label>
            <select
              className="form-select"
              value={form.toeicPart}
              onChange={(event) => setForm({ ...form, toeicPart: event.target.value })}
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
              ].map((value) => (
                <option key={value} value={value}>
                  {enumLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Độ khó</label>
            <select
              className="form-select"
              value={form.difficulty}
              onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
            >
              {["BEGINNER", "EASY", "MEDIUM", "HARD", "ADVANCED"].map((value) => (
                <option key={value} value={value}>
                  {enumLabel(value)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="my-4" />
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1">Các thẻ ({form.cards.length})</h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() =>
              setForm((current) => ({ ...current, cards: [...current.cards, emptyCard()] }))
            }
          >
            + Thêm thẻ
          </button>
        </div>

        <FlashcardFileImport
          cards={form.cards}
          makeCard={emptyCard}
          onChange={(cards) => setForm((current) => ({ ...current, cards }))}
        />

        {form.cards.map((card, index) => (
          <details
            className="teacher-collapsible mb-2"
            key={card.id || index}
            open={form.cards.length === 1 ? true : undefined}
          >
            <summary>
              <div>
                <strong>Thẻ {index + 1}</strong>
                <small>{card.frontText || "Chưa nhập mặt trước"}</small>
              </div>
            </summary>
            <div className="teacher-collapsible-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Mặt trước</label>
                <input
                  className="form-control"
                  value={card.frontText}
                  onChange={(event) => updateCard(index, "frontText", event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Mặt sau</label>
                <textarea
                  className="form-control"
                  value={card.backText}
                  onChange={(event) => updateCard(index, "backText", event.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Phát âm</label>
                <input
                  className="form-control"
                  value={card.pronunciation || ""}
                  onChange={(event) => updateCard(index, "pronunciation", event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Loại từ</label>
                <input
                  className="form-control"
                  value={card.wordType || ""}
                  onChange={(event) => updateCard(index, "wordType", event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Ví dụ</label>
                <input
                  className="form-control"
                  value={card.exampleSentence || ""}
                  onChange={(event) => updateCard(index, "exampleSentence", event.target.value)}
                />
              </div>
              <div className="col-12 text-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={form.cards.length === 1}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      cards: current.cards.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Xóa thẻ
                </button>
              </div>
            </div>
          </details>
        ))}

        <div className="d-flex justify-content-end gap-2 mt-4">
          <Link className="btn btn-light" to="/flashcards">
            Hủy
          </Link>
          <button className="btn btn-primary" disabled={state.saving}>
            {state.saving ? "Đang lưu…" : "Lưu bộ thẻ"}
          </button>
        </div>
      </form>
    </main>
  );
}
