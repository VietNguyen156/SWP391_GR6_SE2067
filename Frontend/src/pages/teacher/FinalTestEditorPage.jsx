import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { statusLabel } from "../../utils/statusLabels";
import { finalTestApi } from "../../services/finalTestService";
import { useConfirm } from "../../components/common/ConfirmDialog";
import VisibilitySwitch from "../../components/common/VisibilitySwitch";

const types = {
  QUESTION_SET: "Bộ đề (nhiều câu hỏi)",
  QUESTION: "Câu hỏi lẻ", // chỉ để hiển thị các phần cũ; không còn chọn được khi tạo mới
  LISTENING: "Nghe (Listening)",
  READING: "Đọc (Reading)",
  SPEAKING: "Nói (Speaking)",
};
const blank = {
  title: "Bài kiểm tra cuối khóa",
  description: "",
  timeLimitMinutes: 60,
  passPercent: 60,
  sections: [],
};
const message = (error) => error.response?.data?.message || error.message || "Không thể lưu Test";

export default function FinalTestEditorPage() {
  const { id } = useParams();
  const confirm = useConfirm();
  const [test, setTest] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState(blank);
  const [type, setType] = useState("QUESTION_SET");
  const [sourceId, setSourceId] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const total = useMemo(
    () => form.sections.reduce((sum, part) => sum + Number(part.points || 0), 0),
    [form.sections],
  );

  async function load() {
    const [current, items, submissions] = await Promise.all([
      finalTestApi.teacherGet(id),
      finalTestApi.catalog(id),
      finalTestApi.teacherAttempts(id),
    ]);
    setTest(current);
    setCatalog(items);
    setAttempts(submissions);
    if (!current.exists) setForm(blank);
    if (current.exists) {
      const draft = current.versions.find((version) => version.status === "DRAFT");
      const version =
        draft || current.versions.find((item) => item.version_no === current.current_version_no);
      setForm({
        title: current.title,
        description: current.description || "",
        timeLimitMinutes: version?.time_limit_minutes || 60,
        passPercent: version?.pass_percent || 60,
        sections: (version?.sections || []).map((part) => ({
          type: part.source_type,
          sourceId:
            part.source_question_id ||
            part.source_test_question_set_id ||
            part.source_test_listening_id ||
            part.source_test_reading_id ||
            part.source_test_speaking_id,
          title: part.title,
          points: part.max_points,
          questionCount: part.question_count,
        })),
      });
    }
  }
  useEffect(() => {
    load().catch((e) => setError(message(e)));
  }, [id]);

  function setPart(index, key, value) {
    setForm((state) => ({
      ...state,
      sections: state.sections.map((part, i) => (i === index ? { ...part, [key]: value } : part)),
    }));
  }
  function move(index, direction) {
    const next = [...form.sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, sections: next });
  }
  function add() {
    const item = catalog.find(
      (candidate) => candidate.type === type && String(candidate.id) === String(sourceId),
    );
    if (!item) return;
    setForm((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          type,
          sourceId: item.id,
          title: item.title,
          points: 10,
        },
      ],
    }));
    setSourceId("");
  }
  async function action(fn) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const options = catalog.filter((item) => item.type === type);

  // Lưu = lưu đề và áp dụng ngay (phiên bản đề được quản lý ngầm để không đổi kết quả cũ).
  async function saveTest() {
    let status = "";
    const saved = await action(async () => {
      await finalTestApi.saveDraft(id, form);
      status = (await finalTestApi.publish(id)).status;
    });
    if (saved)
      setNotice(status === "HIDDEN" ? "Đã lưu Test. Test đang ẩn với học viên." : "Đã lưu Test.");
  }
  async function removeTest() {
    if (
      await confirm({
        title: "Xóa Test cuối khóa?",
        message: "Toàn bộ đề của khóa học này sẽ bị xóa. Không thể hoàn tác.",
        confirmLabel: "Xóa Test",
        danger: true,
      })
    )
      action(() => finalTestApi.remove(id));
  }

  return (
    <main className="container py-4 final-test-editor">
      <Link to={`/teacher/courses/${id}`}>← Về khóa học</Link>
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 my-3">
        <div className="d-flex align-items-center gap-3">
          <h1 className="h2 mb-0">Test cuối khóa</h1>
          {test?.exists && (
            <VisibilitySwitch
              id="test-visible"
              className="cs-course-switch"
              value={test.status}
              on="PUBLISHED"
              off="HIDDEN"
              disabled={busy || test.current_version_no == null}
              onChange={(next) =>
                action(() => (next === "PUBLISHED" ? finalTestApi.show(id) : finalTestApi.hide(id)))
              }
            />
          )}
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            disabled={busy || !form.sections.length}
            onClick={saveTest}
          >
            Lưu Test
          </button>
          {test?.exists && (
            <button className="btn btn-outline-danger" disabled={busy} onClick={removeTest}>
              Xóa Test
            </button>
          )}
        </div>
      </header>
      {notice && <div className="alert alert-success">{notice}</div>}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section className="card p-3 p-md-4 mb-4">
        <div className="row g-3">
          <label className="col-md-6">
            Tên Test
            <input
              className="form-control mt-1"
              maxLength="220"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="col-md-3">
            Thời gian (phút)
            <input
              type="number"
              min="1"
              max="360"
              className="form-control mt-1"
              value={form.timeLimitMinutes}
              onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })}
            />
          </label>
          <label className="col-md-3">
            Điều kiện đạt (%)
            <input
              type="number"
              min="0"
              max="100"
              className="form-control mt-1"
              value={form.passPercent}
              onChange={(e) => setForm({ ...form, passPercent: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="card p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-3">
          <h2 className="h5 mb-0">Các phần của đề</h2>
          <strong>
            {form.sections.length} phần · {total} điểm
          </strong>
        </div>

        <div className="row g-2 align-items-end pb-3 mb-3 border-bottom">
          <label className="col-md-4 d-flex flex-column">
            Loại nội dung
            <select
              className="form-select mt-1"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setSourceId("");
              }}
            >
              {Object.entries(types)
                .filter(([key]) => key !== "QUESTION")
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
          <label className="col-md-6 d-flex flex-column">
            Nội dung từ Ngân hàng đề thi
            <select
              className="form-select mt-1"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">
                {options.length ? "Chọn nội dung" : "Chưa có nội dung phù hợp"}
              </option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={add} disabled={!sourceId}>
              Thêm phần
            </button>
          </div>
        </div>

        {form.sections.length === 0 ? (
          <p className="text-muted mb-0">Chưa có phần nào.</p>
        ) : (
          <ol className="list-unstyled d-grid gap-2 mb-0">
            {form.sections.map((part, index) => (
              <li
                key={`${part.type}-${part.sourceId}-${index}`}
                className="border rounded p-3 d-flex flex-wrap align-items-center gap-3"
              >
                <div className="flex-grow-1" style={{ minWidth: 220 }}>
                  <strong>
                    {index + 1}. {part.title}
                  </strong>
                  <div className="text-muted small">
                    {types[part.type]}
                    {part.questionCount != null ? ` · ${part.questionCount} câu` : ""}
                  </div>
                </div>
                <label className="d-flex align-items-center gap-2 text-muted mb-0">
                  Điểm
                  <input
                    className="form-control"
                    style={{ width: 96 }}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={part.points}
                    onChange={(e) => setPart(index, "points", e.target.value)}
                  />
                </label>
                <div className="btn-group" aria-label="Sắp xếp phần">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!index}
                    onClick={() => move(index, -1)}
                    aria-label="Đưa lên"
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={index === form.sections.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Đưa xuống"
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      setForm({ ...form, sections: form.sections.filter((_, i) => i !== index) })
                    }
                  >
                    Bỏ
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="border-top mt-4 pt-4">
          <h3 className="h6">Lượt làm ({attempts.length})</h3>
          {attempts.length ? (
            <ul className="list-group">
              {attempts.map((item) => (
                <li className="list-group-item d-flex justify-content-between" key={item.id}>
                  <span>
                    {item.full_name} · {statusLabel(item.status)}
                  </span>
                  <Link to={`/teacher/courses/${id}/test/attempts/${item.id}`}>Xem và chấm</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-0">Chưa có lượt làm.</p>
          )}
        </div>
      </section>
    </main>
  );
}
