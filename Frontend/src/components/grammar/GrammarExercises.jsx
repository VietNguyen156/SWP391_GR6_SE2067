import { useEffect, useState } from "react";
import { grammarApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";
import { formatDateTime, formatPercent } from "../../utils/format";
import { MASTERY_LABELS } from "../../utils/listeningSkills";

/**
 * Bài tập sau chủ đề ngữ pháp (học viên): trắc nghiệm và điền chỗ trống. Làm lại không giới hạn,
 * mỗi lượt được lưu; đạt ngưỡng của giáo viên thì chủ đề tự hoàn thành. Chấm điểm ở máy chủ.
 */
export default function GrammarExercises({ topicId, onInfo, onPassed }) {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [state, setState] = useState({ submitting: false, error: "" });

  function load() {
    return Promise.all([grammarApi.exercises(topicId), grammarApi.exerciseHistory(topicId)]).then(
      ([exercises, attempts]) => {
        setData(exercises);
        setHistory(attempts || []);
        onInfo?.({ count: exercises.exercises.length, passScore: exercises.passScore });
      },
    );
  }

  useEffect(() => {
    let active = true;
    setData(null);
    setResult(null);
    setAnswers({});
    load().catch((e) => active && setState((s) => ({ ...s, error: apiError(e, "Không thể tải bài tập").message })));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  if (!data || data.exercises.length === 0) return null;

  const total = data.exercises.length;
  const answered = data.exercises.filter((e) => {
    const a = answers[e.id];
    return a && (a.optionId || (a.text && a.text.trim()));
  }).length;
  const items = Object.fromEntries((result?.items || []).map((item) => [item.exerciseId, item]));

  async function submit() {
    if (state.submitting) return;
    setState({ submitting: true, error: "" });
    try {
      const saved = await grammarApi.submitExercises(topicId, answers);
      setResult(saved);
      await load();
      if (saved.passed) onPassed?.(saved);
      setState({ submitting: false, error: "" });
    } catch (e) {
      setState({ submitting: false, error: apiError(e, "Không thể nộp bài tập").message });
    }
  }

  function retry() {
    setResult(null);
    setAnswers({});
    setState({ submitting: false, error: "" });
  }

  return (
    <section className="teacher-panel p-4 mt-4" aria-labelledby="grammar-exercises-title">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 id="grammar-exercises-title" className="h5 fw-bold mb-1">
            Bài tập củng cố ({total} câu)
          </h2>
          <small className="text-muted">
            Đạt từ {data.passScore}% để hoàn thành chủ đề. Bạn có thể làm lại nhiều lần.
          </small>
        </div>
        <div className="text-end small">
          <span className={`practice-status ${data.mastery === "MASTERED" ? "is-good" : data.mastery === "LEARNING" ? "is-weak" : "is-new"}`}>
            {MASTERY_LABELS[data.mastery] || data.mastery}
          </span>
          {data.attemptCount > 0 && (
            <div className="text-muted mt-1">
              Cao nhất {formatPercent(data.bestScore)} · gần nhất {formatPercent(data.lastScore)} ·{" "}
              {data.attemptCount} lượt
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className={`alert ${result.passed ? "alert-success" : "alert-warning"} mt-3`} role="status">
          <strong>
            {result.correct}/{result.total} đúng ({formatPercent(result.score)})
          </strong>{" "}
          {result.passed
            ? "· Đã đạt, chủ đề được đánh dấu hoàn thành."
            : `· Chưa đạt (cần ${result.passScore}%). Xem lại phần giải thích rồi làm lại.`}
        </div>
      )}

      <ol className="list-unstyled mt-3 d-grid gap-3">
        {data.exercises.map((exercise, index) => {
          const item = items[exercise.id];
          const answer = answers[exercise.id] || {};
          return (
            <li
              className={`border rounded-3 p-3 ${item ? (item.correct ? "border-success" : "border-danger") : ""}`}
              key={exercise.id}
            >
              <div className="fw-semibold mb-2">
                Câu {index + 1}. {exercise.questionText}
                {item && (
                  <em className={`ms-2 ${item.correct ? "text-success" : "text-danger"}`}>
                    {item.correct ? "Đúng" : "Sai"}
                  </em>
                )}
              </div>
              {exercise.type === "FILL_BLANK" ? (
                <input
                  className="form-control"
                  aria-label={`Đáp án câu ${index + 1}`}
                  placeholder="Nhập đáp án của bạn"
                  disabled={Boolean(result) || state.submitting}
                  value={answer.text || ""}
                  onChange={(e) =>
                    setAnswers((cur) => ({ ...cur, [exercise.id]: { text: e.target.value } }))
                  }
                />
              ) : (
                <div className="d-grid gap-2">
                  {exercise.options.map((option, oi) => {
                    const picked = answer.optionId === option.id;
                    const isRight = item && item.correctOptionId === option.id;
                    return (
                      <label
                        className={`student-option ${picked ? "selected" : ""} ${isRight ? "is-answer" : ""} ${item && picked && !isRight ? "is-wrong-pick" : ""}`}
                        key={option.id}
                      >
                        <input
                          type="radio"
                          name={`ge-${exercise.id}`}
                          checked={picked}
                          disabled={Boolean(result) || state.submitting}
                          onChange={() =>
                            setAnswers((cur) => ({ ...cur, [exercise.id]: { optionId: option.id } }))
                          }
                        />
                        <span className="student-option-key">{String.fromCharCode(65 + oi)}</span>
                        <span>{option.optionText}</span>
                        {isRight && <b>{picked ? "Bạn chọn · Đúng" : "Đáp án đúng"}</b>}
                      </label>
                    );
                  })}
                </div>
              )}
              {item && exercise.type === "FILL_BLANK" && !item.correct && (
                <p className="mt-2 mb-0 small">
                  <strong>Đáp án chấp nhận:</strong> {item.correctAnswer}
                </p>
              )}
              {item && !item.correct && item.explanation && (
                <p className="mt-2 mb-0 small">
                  <strong>Giải thích:</strong> {item.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span className="text-muted small">
          {result ? "Đã chấm xong." : `${answered}/${total} câu đã trả lời; câu bỏ trống tính là sai.`}
        </span>
        {result ? (
          <button type="button" className="btn btn-outline-primary" onClick={retry}>
            Làm lại
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={submit} disabled={state.submitting}>
            {state.submitting ? "Đang chấm…" : "Nộp bài tập"}
          </button>
        )}
      </div>

      {history.length > 0 && (
        <details className="mt-3">
          <summary>Lịch sử làm bài tập ({history.length} lượt)</summary>
          <ul className="list-unstyled mt-2 mb-0">
            {history.map((attempt, index) => (
              <li className="d-flex flex-wrap justify-content-between gap-2 py-1" key={attempt.attemptId}>
                <span>
                  Lượt {history.length - index} · {attempt.passed ? "Đạt" : "Chưa đạt"}
                </span>
                <span>
                  {attempt.correct}/{attempt.total} · {formatPercent(attempt.score)} ·{" "}
                  {formatDateTime(attempt.submittedAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
