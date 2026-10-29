import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Icon from "../../components/common/Icon";
import { enumLabel } from "../../utils/statusLabels";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { Link, useSearchParams } from "react-router-dom";
import Tabs from "../../components/common/Tabs";
import IconButton from "../../components/common/IconButton";
import FileImport, { McqPreview } from "../../components/material-view/FileImport";
import { questionApi } from "../../services/assessmentService";
import { testBankApi } from "../../services/testBankService";
import TestBankList from "../../components/teacher/TestBankList";
import questionBankTemplate from "../../assets/import-templates/question-bank-template.txt?raw";
import { parseMcqText } from "../../utils/questionImport";
/** embedded: nằm trong tab "Câu hỏi" của Ngân hàng đề thi (không tự vẽ tiêu đề trang). */
export default function QuestionManagementPage({ embedded = false }) {
  const confirm = useConfirm();
  // Trong Ngân hàng đề thi: "Câu hỏi" và "Bộ đề" là hai màn riêng (?view=sets), không xếp chung một trang.
  const [params, setParams] = useSearchParams();
  const view = embedded && params.get("view") === "sets" ? "sets" : "questions";
  const showView = (key) => {
    const next = new URLSearchParams(params);
    if (key === "sets") next.set("view", "sets");
    else next.delete("view");
    setParams(next, { replace: true });
  };
  const [questions, setQuestions] = useState([]),
    [query, setQuery] = useState(""),
    [level, setLevel] = useState(""),
    [state, setState] = useState({ loading: true, error: "" }),
    // Chọn nhiều câu (theo thứ tự chọn) để gom thành bộ đề.
    [picked, setPicked] = useState([]),
    [setTitle, setSetTitle] = useState(""),
    [setsKey, setSetsKey] = useState(0),
    [saving, setSaving] = useState(false),
    [importing, setImporting] = useState(false),
    [importDifficulty, setImportDifficulty] = useState("MEDIUM"),
    [notice, setNotice] = useState("");
  async function load() {
    try {
      setQuestions(await questionApi.list());
      setState({ loading: false, error: "" });
      return true;
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || "Không thể tải câu hỏi" });
      return false;
    }
  }
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(
    () =>
      questions.filter(
        (x) =>
          (!level || x.difficulty === level) &&
          `${x.questionText} ${x.explanation || ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [questions, query, level],
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
  async function importQuestions(items) {
    setImporting(true);
    setState((current) => ({ ...current, error: "" }));
    setNotice("");
    let imported = 0;
    let failure = "";
    try {
      for (const item of items) {
        try {
          await questionApi.create({
            questionText: item.questionText,
            explanation: item.explanation,
            difficulty: importDifficulty,
            lessonId: null,
            options: item.options.map(({ optionText, correct }) => ({
              content: optionText,
              correct,
            })),
          });
          imported += 1;
        } catch (error) {
          failure = error.response?.data?.message || error.message || "Lỗi không xác định";
          break;
        }
      }
      const refreshed = await load();
      if (failure) {
        setState({
          loading: false,
          error: `Đã lưu ${imported}/${items.length} câu. Dừng nhập để tránh lưu thiếu; lỗi: ${failure}`,
        });
      } else if (refreshed) {
        setNotice(`Đã nhập ${imported} câu hỏi vào ngân hàng.`);
      }
    } finally {
      setImporting(false);
    }
  }
  const togglePicked = (id) =>
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  async function createSet(e) {
    e.preventDefault();
    setSaving(true);
    setState((s) => ({ ...s, error: "" }));
    setNotice("");
    try {
      const made = await testBankApi["question-sets"].create({
        title: setTitle,
        description: "",
        questionIds: picked,
      });
      setNotice(`Đã tạo bộ đề “${made.title}” gồm ${made.questions.length} câu.`);
      setPicked([]);
      setSetTitle("");
      setSetsKey((k) => k + 1);
      showView("sets");
    } catch (err) {
      setState((s) => ({ ...s, error: err.response?.data?.message || "Không thể tạo bộ đề" }));
    } finally {
      setSaving(false);
    }
  }
  const Shell = embedded ? "div" : "main";
  return (
    <Shell className={embedded ? undefined : "container content-shell"}>
      {!embedded && (
        <PageHeader
          title={"Ngân hàng đề thi"}
          actions={
            <Link className="btn btn-primary" to="/teacher/questions/new">
              <Icon name="plus" size={18} /> Tạo câu hỏi
            </Link>
          }
        />
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      {embedded && (
        <Tabs
          variant="pills"
          className="mb-3"
          ariaLabel="Câu hỏi hoặc bộ đề"
          activeKey={view}
          onChange={showView}
          items={[
            { key: "questions", label: "Câu hỏi" },
            { key: "sets", label: "Bộ đề" },
          ]}
        />
      )}
      {view === "sets" ? (
        <>
          <TestBankList type="question-sets" title="Bộ đề" refreshKey={setsKey} />
        </>
      ) : (
        <section className="teacher-panel">
          <div className="teacher-panel-head question-toolbar">
            <div>
              <h2>{filtered.length} câu hỏi</h2>
            </div>
            <div className="d-flex gap-2">
              {embedded && (
                <Link className="btn btn-primary" to="/teacher/questions/new">
                  <Icon name="plus" size={18} /> Tạo câu hỏi
                </Link>
              )}
              <select
                className="form-select w-auto"
                aria-label="Lọc theo độ khó"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">Mọi độ khó</option>
                {["BEGINNER", "EASY", "MEDIUM", "HARD", "ADVANCED"].map((value) => (
                  <option key={value} value={value}>
                    {enumLabel(value)}
                  </option>
                ))}
              </select>
              <input
                className="form-control"
                placeholder="Tìm câu hỏi…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          {picked.length > 0 && (
            <form
              className="d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom bg-light"
              onSubmit={createSet}
              aria-label="Tạo bộ đề từ các câu đã chọn"
            >
              <strong>Đã chọn {picked.length} câu</strong>
              <input
                required
                maxLength={200}
                className="form-control w-auto flex-grow-1"
                placeholder="Tên bộ đề"
                aria-label="Tên bộ đề"
                value={setTitle}
                onChange={(e) => setSetTitle(e.target.value)}
              />
              <button className="btn btn-primary" disabled={saving}>
                Tạo bộ đề từ {picked.length} câu
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setPicked([])}
              >
                Bỏ chọn
              </button>
            </form>
          )}
          <div className="teacher-panel-body">
            <FileImport
              template={questionBankTemplate}
              templateName="question-bank-template.txt"
              noun="câu hỏi"
              confirmLabel={(count) => `Lưu ${count} câu vào ngân hàng`}
              disabled={importing}
              parse={(text) => {
                const { questions: items, errors } = parseMcqText(text, {
                  minOptions: 4,
                  maxOptions: 4,
                });
                return { items, errors };
              }}
              renderItem={(item) => <McqPreview q={item} />}
              onImport={importQuestions}
              extra={
                <label className="form-label d-block">
                  Độ khó áp dụng cho các câu được nhập
                  <select
                    className="form-select mt-1"
                    value={importDifficulty}
                    onChange={(event) => setImportDifficulty(event.target.value)}
                    disabled={importing}
                  >
                    {["BEGINNER", "EASY", "MEDIUM", "HARD", "ADVANCED"].map((value) => (
                      <option key={value} value={value}>
                        {enumLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              }
            />
            <div className="teacher-question-grid">
              {filtered.map((x, i) => (
                <article className="teacher-question-card" key={x.id}>
                  {embedded && (
                    <input
                      type="checkbox"
                      className="form-check-input align-self-center flex-shrink-0"
                      checked={picked.includes(x.id)}
                      onChange={() => togglePicked(x.id)}
                      aria-label={`Chọn câu: ${x.questionText}`}
                    />
                  )}
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
                      disabledReason="Câu hỏi đang được dùng trong Test cuối khóa."
                    />
                  </div>
                </article>
              ))}
              {!filtered.length && <div className="teacher-empty">Không có câu hỏi phù hợp.</div>}
            </div>
          </div>
        </section>
      )}
    </Shell>
  );
}
