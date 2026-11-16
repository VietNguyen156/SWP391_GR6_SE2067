import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { formatPercent } from "../../utils/format";
import { Link, useLocation, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import AnswerReview from "../../components/learning/AnswerReview";
import MaterialShell from "../../components/learning/MaterialShell";
import { quizApi, resultApi } from "../../services/assessmentService";
import { quizFallback } from "../../utils/materialNavigation";

/** Kết quả một lượt làm quiz, có URL riêng nên tải lại trang không tạo lượt mới. */
export default function QuizResultPage() {
  const { id, attemptId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    resultApi
      .get(attemptId)
      .then((data) => active && setResult(data))
      .catch((e) => active && setError(e.response?.data?.message || "Không thể tải kết quả"));
    quizApi
      .get(id)
      .then((data) => active && setQuiz(data))
      .catch(() => active && setQuiz(null));
    return () => {
      active = false;
    };
  }, [id, attemptId]);

  if (error)
    return (
      <main className="container py-5">
        <ErrorState message={error} actions={[{ label: "Kết quả", to: "/results" }]} />
      </main>
    );
  if (!result) return <LoadingState />;

  const warning = location.state?.warning;
  return (
    <MaterialShell
      lessonId={quiz?.lessonId}
      type="QUIZ"
      materialId={result.quizId}
      title={result.quizTitle}
      fallback={quizFallback}
    >
      <main className="container py-4 result-shell">
        {warning && <div className="alert alert-warning">{warning}</div>}
        {result.status === "AUTO_SUBMITTED" && (
          <div className="alert alert-info">Bài được tự động nộp khi hết giờ.</div>
        )}
        <section className="result-score-card">
          <span>Kết quả</span>
          <strong>{formatPercent(result.score)}</strong>
          <h1>{result.quizTitle}</h1>
          <div className="assessment-stat-grid">
            <div>
              <strong>{result.correctAnswers}</strong>
              <span>Đúng</span>
            </div>
            <div>
              <strong>{result.wrongAnswers}</strong>
              <span>Sai / bỏ trống</span>
            </div>
            <div>
              <strong>{result.totalQuestions}</strong>
              <span>Tổng câu</span>
            </div>
          </div>
          <div className="d-flex justify-content-center flex-wrap gap-2">
            <Link className="btn btn-outline-secondary" to="/results">
              Lịch sử kết quả
            </Link>
            <Link className="btn btn-outline-primary" to={`/quiz/${result.quizId}`}>
              Làm lại
            </Link>
            {quiz?.lessonId ? (
              <Link className="btn btn-primary" to={`/lessons/${quiz.lessonId}`}>
                Về bài học
              </Link>
            ) : (
              <Link className="btn btn-primary" to={quizFallback.to}>
                {quizFallback.label}
              </Link>
            )}
          </div>
        </section>
        <AnswerReview answers={result.answers} />
      </main>
    </MaterialShell>
  );
}
