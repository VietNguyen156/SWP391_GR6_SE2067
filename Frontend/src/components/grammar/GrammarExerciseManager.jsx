import { useEffect, useState } from "react";
import { grammarApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";
import { formatPercent } from "../../utils/format";

const emptyMcq = () => ({
  type: "MULTIPLE_CHOICE",
  questionText: "",
  correctAnswer: "",
  explanation: "",
  options: [
    { optionText: "", correct: true },
    { optionText: "", correct: false },
  ],
});
const emptyFill = () => ({
  type: "FILL_BLANK",
  questionText: "",
  correctAnswer: "",
  explanation: "",
  options: [],
});

/** Giáo viên soạn bài tập sau chủ đề ngữ pháp và xem thống kê lỗi. Khóa sửa khi đã có học viên làm. */
export default function GrammarExerciseManager({ topicId }) {
  const [passScore, setPassScore] = useState(70);
  const [items, setItems] = useState([]);
  const [locked, setLocked] = useState(false);
  const [stats, setStats] = useState(null);
  const [state, setState] = useState({ loading: true, saving: false, error: "", ok: "" });

  function load() {
    return Promise.all([grammarApi.teacherExercises(topicId), grammarApi.topicStats(topicId)]).then(
      ([data, topicStats]) => {
        setPassScore(data.passScore);
        setLocked(data.locked);
        setStats(topicStats);
        setItems(
          data.exercises.map((e) => ({
            type: e.type,
            questionText: e.questionText,
            correctAnswer: e.correctAnswer || "",
            explanation: e.explanation || "",
            options: (e.options || []).map((o) => ({ optionText: o.optionText, correct: o.correct })),
          })),
        );
        setState((s) => ({ ...s, loading: false }));
      },
    );
  }

  useEffect(() => {
    load().catch((e) =>
      setState({ loading: false, saving: false, ok: "", error: apiError(e, "Không thể tải bài tập").message }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const update = (i, patch) => setItems((list) => list.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const updateOption = (i, j, patch) =>
    update(i, { options: items[i].options.map((o, k) => (k === j ? { ...o, ...patch } : o)) });
  const setCorrect = (i, j) =>
    update(i, { options: items[i].options.map((o, k) => ({ ...o, correct: k === j })) });

  async function save() {
    setState((s) => ({ ...s, saving: true, error: "", ok: "" }));
    try {
      await grammarApi.saveExercises(topicId, {
        passScore: Number(passScore),
        exercises: items.map((x) => ({
          type: x.type,
          questionText: x.questionText,
          correctAnswer: x.type === "FILL_BLANK" ? x.correctAnswer : null,
          explanation: x.explanation || null,
          options: x.type === "MULTIPLE_CHOICE" ? x.options : null,
        })),
      });
      await load();
      setState((s) => ({ ...s, saving: false, ok: "Đã lưu bài tập" }));
    } catch (e) {
      setState((s) => ({ ...s, saving: false, error: apiError(e, "Không thể lưu bài tập").message }));
    }
  }

  if (state.loading) return null;

  return (
    <section className="mt-4">
      <h2 className="h5 fw-bold">Bài tập sau chủ đề ({items.length})</h2>
      {stats && stats.attemptCount > 0 && (
        <div className="alert alert-info">
          <strong>{stats.studentCount}</strong> học viên · <strong>{stats.attemptCount}</strong> lượt làm · đạt{" "}
          <strong>{stats.passedStudentCount}</strong> ({formatPercent(stats.passRate)}) · điểm TB{" "}
          <strong>{formatPercent(stats.averageScore)}</strong>
          {stats.hardestExercises?.length > 0 && (
            <ul className="mb-0 mt-2">
              {stats.hardestExercises.map((h) => (
                <li key={h.exerciseId}>
                  Sai nhiều: “{h.questionText}” — {h.wrong}/{h.answered} lượt sai ({formatPercent(h.wrongRate)})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {locked && (
        <div className="alert alert-warning">
          Đã có học viên làm bài tập nên không thể sửa để bảo toàn kết quả.
        </div>
      )}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      {state.ok && <div className="alert alert-success">{state.ok}</div>}
      <div className="mb-3" style={{ maxWidth: 240 }}>
        <label className="form-label">Điểm đạt (%)</label>
        <input
          type="number"
          min="1"
          max="100"
          className="form-control"
          value={passScore}
          disabled={locked}
          onChange={(e) => setPassScore(e.target.value)}
        />
      </div>
      {items.map((x, i) => (
        <div key={i} className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between mb-2">
            <strong>
              Câu {i + 1} · {x.type === "FILL_BLANK" ? "Điền chỗ trống" : "Trắc nghiệm"}
            </strong>
            {!locked && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setItems((l) => l.filter((_, k) => k !== i))}
              >
                Xóa
              </button>
            )}
          </div>
          <textarea
            className="form-control mb-2"
            rows={2}
            placeholder="Nội dung câu hỏi"
            value={x.questionText}
            disabled={locked}
            onChange={(e) => update(i, { questionText: e.target.value })}
          />
          {x.type === "FILL_BLANK" ? (
            <input
              className="form-control mb-2"
              placeholder="Đáp án chấp nhận, ngăn cách bằng dấu |"
              value={x.correctAnswer}
              disabled={locked}
              onChange={(e) => update(i, { correctAnswer: e.target.value })}
            />
          ) : (
            <>
              {x.options.map((o, j) => (
                <div key={j} className="input-group mb-1">
                  <span className="input-group-text">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={o.correct}
                      disabled={locked}
                      onChange={() => setCorrect(i, j)}
                      aria-label="Đáp án đúng"
                    />
                  </span>
                  <input
                    className="form-control"
                    placeholder={`Đáp án ${j + 1}`}
                    value={o.optionText}
                    disabled={locked}
                    onChange={(e) => updateOption(i, j, { optionText: e.target.value })}
                  />
                  {!locked && x.options.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        const opts = x.options.filter((_, k) => k !== j);
                        if (!opts.some((p) => p.correct)) opts[0] = { ...opts[0], correct: true };
                        update(i, { options: opts });
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {!locked && x.options.length < 4 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mb-2"
                  onClick={() => update(i, { options: [...x.options, { optionText: "", correct: false }] })}
                >
                  + Thêm đáp án
                </button>
              )}
            </>
          )}
          <input
            className="form-control"
            placeholder="Giải thích (hiện sau khi nộp)"
            value={x.explanation}
            disabled={locked}
            onChange={(e) => update(i, { explanation: e.target.value })}
          />
        </div>
      ))}
      {!locked && (
        <div className="d-flex gap-2 flex-wrap">
          <button type="button" className="btn btn-outline-primary" onClick={() => setItems((l) => [...l, emptyMcq()])}>
            + Trắc nghiệm
          </button>
          <button type="button" className="btn btn-outline-primary" onClick={() => setItems((l) => [...l, emptyFill()])}>
            + Điền chỗ trống
          </button>
          <button type="button" className="btn btn-primary" disabled={state.saving} onClick={save}>
            {state.saving ? "Đang lưu…" : "Lưu bài tập"}
          </button>
        </div>
      )}
    </section>
  );
}
