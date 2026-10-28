import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditGate from "../../components/common/EditGate";
import { EditHeader, SaveBar } from "../../components/material-view/EditFrame";
import { questionApi } from "../../services/assessmentService";
import { testBankApi } from "../../services/testBankService";
import { enumLabel } from "../../utils/statusLabels";
import useEditForm from "../../utils/useEditForm";
import useUnsavedGuard from "../../utils/useUnsavedGuard";

const BACK = { to: "/teacher/questions?view=sets", label: "Bộ đề" };
const api = testBankApi["question-sets"];
const LEVELS = ["BEGINNER", "EASY", "MEDIUM", "HARD", "ADVANCED"];

/**
 * Tạo/sửa một bộ đề: chọn nhiều câu từ ngân hàng câu hỏi và sắp xếp thứ tự.
 * Khi tạo Test, chọn cả bộ này làm một phần của Test.
 */
export default function QuestionSetEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const edit = useEditForm(async () => {
    const [questions, set] = await Promise.all([questionApi.list(), editing ? api.get(id) : null]);
    return {
      questions,
      name: set?.title,
      usedBy: set?.usedBy || 0,
      form: {
        title: set?.title || "",
        questionIds: (set?.questions || []).map((q) => q.id),
      },
    };
  }, [id]);
  const { form, setForm } = edit;
  const { questions = [], usedBy = 0 } = edit.extra;
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [state, setState] = useState({ saving: false, error: "" });
  const release = useUnsavedGuard(edit.dirty);
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const chosen = new Set(form?.questionIds || []);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return questions.filter(
      (q) =>
        (!level || q.difficulty === level) &&
        (!needle ||
          `${q.questionText} ${(q.options || []).map((o) => o.content).join(" ")}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [questions, query, level]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (qid) =>
    set({
      questionIds: chosen.has(qid)
        ? form.questionIds.filter((x) => x !== qid)
        : [...form.questionIds, qid],
    });
  const move = (index, delta) => {
    const next = [...form.questionIds];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set({ questionIds: next });
  };

  async function save(e) {
    e.preventDefault();
    if (!form.questionIds.length) {
      setState({ saving: false, error: "Chọn ít nhất một câu hỏi cho bộ đề." });
      return;
    }
    setState({ saving: true, error: "" });
    try {
      const payload = { ...form, description: "" };
      if (editing) await api.update(id, payload);
      else await api.create(payload);
      release();
      nav(BACK.to, { replace: true });
    } catch (err) {
      setState({ saving: false, error: err.response?.data?.message || "Không thể lưu bộ đề" });
    }
  }

  if (!edit.ready) return <EditGate edit={edit} back={BACK} />;
  return (
    <main className="container py-5 content-shell">
      <EditHeader
        title={editing ? `Sửa bộ đề: ${edit.extra.name || "…"}` : "Tạo bộ đề"}
        back={BACK}
      />
      {usedBy > 0 && (
        <div className="alert alert-info">
          Bộ đề đang được dùng trong {usedBy} phần Test. Sửa bộ đề chỉ áp dụng cho phiên bản Test
          xuất bản sau; các Test đã xuất bản và kết quả cũ giữ nguyên.
        </div>
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form id="question-set-form" className="teacher-panel p-4" onSubmit={save}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label" htmlFor="qs-title">
              Tên bộ đề
            </label>
            <input
              id="qs-title"
              required
              maxLength={200}
              className="form-control"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </div>
        </div>

        <hr className="my-4" />
        <h2 className="h5 fw-bold">Đã chọn ({form.questionIds.length} câu)</h2>
        {form.questionIds.length === 0 ? (
          <p className="text-muted">Chưa chọn câu hỏi nào.</p>
        ) : (
          <ol className="list-group list-group-numbered mb-3" aria-label="Câu hỏi đã chọn">
            {form.questionIds.map((qid, index) => (
              <li
                key={qid}
                className="list-group-item d-flex justify-content-between align-items-start gap-2"
              >
                <span className="me-auto">
                  {byId.get(qid)?.questionText || `Câu #${qid} (không còn trong ngân hàng)`}
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    aria-label={`Đưa câu ${index + 1} lên`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    aria-label={`Đưa câu ${index + 1} xuống`}
                    disabled={index === form.questionIds.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    aria-label={`Bỏ câu ${index + 1}`}
                    onClick={() => toggle(qid)}
                  >
                    Bỏ
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
          <h2 className="h5 fw-bold mb-0">Ngân hàng câu hỏi ({visible.length})</h2>
          <div className="d-flex flex-wrap gap-2">
            <select
              className="form-select w-auto"
              aria-label="Lọc theo độ khó"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">Mọi độ khó</option>
              {LEVELS.map((value) => (
                <option key={value} value={value}>
                  {enumLabel(value)}
                </option>
              ))}
            </select>
            <input
              className="form-control w-auto"
              placeholder="Tìm câu hỏi hoặc đáp án…"
              aria-label="Tìm câu hỏi"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div
          className="list-group mt-2 qs-picker"
          style={{ maxHeight: 560, overflowY: "auto", gap: 10 }}
        >
          {visible.map((q) => (
            <label
              key={q.id}
              className="list-group-item d-flex gap-3 align-items-start"
              style={{ borderTopWidth: 1, borderRadius: 8 }}
            >
              <input
                type="checkbox"
                className="form-check-input mt-1 flex-shrink-0"
                checked={chosen.has(q.id)}
                onChange={() => toggle(q.id)}
                aria-label={q.questionText}
              />
              <div className="flex-grow-1">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span className="badge text-bg-light">{enumLabel(q.difficulty)}</span>
                  <span className="text-muted small">#{q.id}</span>
                </div>
                <div className="fw-semibold">{q.questionText}</div>
                <ul className="list-unstyled row row-cols-1 row-cols-md-2 g-1 small mt-2 mb-0">
                  {(q.options || []).map((o, i) => (
                    <li
                      key={o.id || i}
                      className={o.correct ? "text-success fw-semibold" : "text-muted"}
                    >
                      {String.fromCharCode(65 + i)}. {o.content}
                      {o.correct ? " ✓" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          ))}
          {!visible.length && (
            <div className="list-group-item text-muted">Không có câu hỏi phù hợp.</div>
          )}
        </div>
      </form>
      <SaveBar
        formId="question-set-form"
        cancelTo={BACK.to}
        saving={state.saving}
        label="Lưu bộ đề"
      />
    </main>
  );
}
