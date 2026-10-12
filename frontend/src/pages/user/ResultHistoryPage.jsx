import { useEffect, useState } from "react";
import { formatDateTime, formatPercent } from "../../utils/format";
import { resultApi } from "../../services/assessmentService";
import AnswerReview from "../../components/learning/AnswerReview";

export default function ResultHistoryPage() {
  const [results, setResults] = useState([]);
  const [detail, setDetail] = useState(null);
  const [state, setState] = useState({ loading: true, detailLoading: false, error: "" });
  useEffect(() => {
    resultApi
      .list()
      .then(setResults)
      .catch((error) =>
        setState((current) => ({
          ...current,
          error: error.response?.data?.message || "Không thể tải kết quả",
        })),
      )
      .finally(() => setState((current) => ({ ...current, loading: false })));
  }, []);
  async function view(id) {
    setState((current) => ({ ...current, detailLoading: true, error: "" }));
    try {
      setDetail(await resultApi.get(id));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Không thể tải chi tiết",
      }));
    } finally {
      setState((current) => ({ ...current, detailLoading: false }));
    }
  }
  return (
    <main className="container py-5 content-shell">
      <div className="mb-4">
        <h1 className="h2 fw-bold">Lịch sử kết quả</h1>
      </div>
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      {state.loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <div className="row g-4">
          <section className="col-lg-5">
            {results.map((result) => (
              <button
                className={`result-history-item ${detail?.id === result.id ? "active" : ""}`}
                onClick={() => view(result.id)}
                key={result.id}
              >
                <span>
                  <strong>{result.quizTitle}</strong>
                  <small>
                    {formatDateTime(result.endTime)} · {result.correctAnswers}/
                    {result.totalQuestions} câu đúng
                  </small>
                </span>
                <b>{formatPercent(result.score)}</b>
              </button>
            ))}
            {!results.length && (
              <div className="content-empty">Bạn chưa hoàn thành bài kiểm tra nào.</div>
            )}
          </section>
          <section className="col-lg-7">
            {state.detailLoading && <div className="spinner-border text-primary" />}
            {detail && !state.detailLoading && (
              <>
                <div className="result-detail-summary">
                  <span>Điểm</span>
                  <strong>{formatPercent(detail.score)}</strong>
                  <h2>{detail.quizTitle}</h2>
                  <p>
                    {detail.correctAnswers} đúng · {detail.wrongAnswers} sai / bỏ trống ·{" "}
                    {detail.totalQuestions} câu
                  </p>
                </div>
                <AnswerReview answers={detail.answers} />
              </>
            )}
            {!detail && !state.detailLoading && results.length > 0 && (
              <div className="content-empty">Chọn một kết quả để xem lại đáp án.</div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
