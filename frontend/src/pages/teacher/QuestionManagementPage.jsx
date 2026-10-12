import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Icon from "../../components/common/Icon";
import { enumLabel } from "../../utils/statusLabels";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { Link } from "react-router-dom";
import IconButton from "../../components/common/IconButton";
import { questionApi } from "../../services/assessmentService";
export default function QuestionManagementPage() {
  const confirm = useConfirm();
  const [questions, setQuestions] = useState([]),
    [query, setQuery] = useState(""),
    [state, setState] = useState({ loading: true, error: "" });
  async function load() {
    try {
      setQuestions(await questionApi.list());
      setState({ loading: false, error: "" });
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || "Không thể tải câu hỏi" });
    }
  }
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(
    () =>
      questions.filter((x) =>
        `${x.questionText} ${x.explanation || ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [questions, query],
  );
  async function remove(x) {
    if (
      !(await confirm({
        message: "Xóa câu hỏi này?",
        title: "Xóa câu hỏi",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await questionApi.remove(x.id);
      await load();
    } catch (e) {
      setState((s) => ({ ...s, error: e.response?.data?.message || "Câu hỏi đang được sử dụng" }));
    }
  }
  return (
    <main className="container content-shell">
      <PageHeader
        title={"Ngân hàng câu hỏi"}
        actions={
          <>
            <Link className="btn btn-primary" to="/teacher/questions/new">
              <Icon name="plus" size={18} /> Tạo câu hỏi
            </Link>
          </>
        }
      />
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <section className="teacher-panel">
        <div className="teacher-panel-head question-toolbar">
          <div>
            <h2>{filtered.length} câu hỏi</h2>
          </div>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              placeholder="Tìm câu hỏi…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="teacher-panel-body">
          <div className="teacher-question-grid">
            {filtered.map((x, i) => (
              <article className="teacher-question-card" key={x.id}>
                <div className="teacher-question-number">{String(i + 1).padStart(2, "0")}</div>
                <div className="flex-grow-1">
                  <div className="d-flex gap-2 mb-2">
                    <span className="badge text-bg-light">{enumLabel(x.difficulty)}</span>
                  </div>
                  <h2>{x.questionText}</h2>
                  <p>
                    Đáp án: <strong>{x.options.find((o) => o.correct)?.content}</strong>
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <IconButton icon="edit" label="Sửa" to={`/teacher/questions/${x.id}/edit`} />
                  <IconButton
                    icon="trash"
                    label="Xóa"
                    tone="danger"
                    onClick={() => remove(x)}
                    disabled={x.inUse}
                    disabledReason="Câu hỏi thuộc quiz đã có lượt làm nên không thể xóa."
                  />
                </div>
              </article>
            ))}
            {!filtered.length && <div className="teacher-empty">Không có câu hỏi phù hợp.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
