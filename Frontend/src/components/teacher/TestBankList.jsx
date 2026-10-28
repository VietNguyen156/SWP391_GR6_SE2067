import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useConfirm } from "../common/ConfirmDialog";
import Icon from "../common/Icon";
import IconButton from "../common/IconButton";
import { testBankApi } from "../../services/testBankService";
import { statusLabel } from "../../utils/statusLabels";

export const BANK_TYPES = {
  "question-sets": { label: "Exam sets", one: "bộ đề", create: "Tạo bộ đề" },
  listening: { label: "Nghe", one: "bài Nghe", create: "Tạo bài Nghe" },
  reading: { label: "Đọc", one: "bài Đọc", create: "Tạo bài Đọc" },
  speaking: { label: "Nói", one: "đề Nói", create: "Tạo đề Nói" },
};

/** Danh sách một loại nội dung (Nghe / Đọc / Nói) trong Ngân hàng đề thi của giáo viên. */
export default function TestBankList({ type, title, refreshKey = 0 }) {
  const api = testBankApi[type];
  const meta = BANK_TYPES[type];
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ loading: true, error: "" });

  async function load() {
    try {
      setItems(await api.list());
      setState({ loading: false, error: "" });
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || "Không thể tải danh sách" });
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, refreshKey]);

  const filtered = useMemo(
    () => items.filter((x) => x.title.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  async function remove(x) {
    if (
      !(await confirm({
        title: `Xóa ${meta.one}`,
        message: `Xóa “${x.title}” khỏi ngân hàng?`,
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await api.remove(x.id);
      await load();
    } catch (e) {
      setState((s) => ({ ...s, error: e.response?.data?.message || "Không thể xóa" }));
    }
  }

  return (
    <section className="teacher-panel">
      <div className="teacher-panel-head question-toolbar">
        <div>
          <h2>{title ? `${title} (${filtered.length})` : `${filtered.length} mục`}</h2>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-primary" to={`/teacher/test-bank/${type}/new`}>
            <Icon name="plus" size={18} /> {meta.create}
          </Link>
          <input
            className="form-control"
            placeholder="Tìm theo tên…"
            aria-label="Tìm theo tên"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {state.error && <div className="alert alert-danger m-3">{state.error}</div>}
      <div className="teacher-panel-body">
        <div className="teacher-question-grid">
          {filtered.map((x, i) => (
            <article className="teacher-question-card" key={x.id}>
              <div className="teacher-question-number">{String(i + 1).padStart(2, "0")}</div>
              <div className="flex-grow-1">
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <span className="badge text-bg-light">
                    {x.status === "ACTIVE" ? "Có thể chọn vào Test" : statusLabel(x.status)}
                  </span>
                  {x.questions && (
                    <span className="badge text-bg-light">{x.questions.length} câu hỏi</span>
                  )}
                </div>
                <h2>{x.title}</h2>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <IconButton
                  icon="edit"
                  label="Sửa"
                  to={`/teacher/test-bank/${type}/${x.id}/edit`}
                />
                <IconButton
                  icon="trash"
                  label="Xóa"
                  tone="danger"
                  onClick={() => remove(x)}
                  disabled={x.usedBy > 0}
                  disabledReason="Đang được dùng trong Test cuối khóa."
                />
              </div>
            </article>
          ))}
          {!state.loading && !filtered.length && (
            <div className="teacher-empty">
              Chưa có {meta.one} nào trong ngân hàng.{" "}
              <Link to={`/teacher/test-bank/${type}/new`}>{meta.create}</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
