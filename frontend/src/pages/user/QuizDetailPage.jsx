import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { quizKindLabel } from "../../utils/statusLabels";
import { formatPercent } from "../../utils/format";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import MaterialShell from "../../components/learning/MaterialShell";
import { quizApi } from "../../services/assessmentService";
import { apiError } from "../../utils/apiError";
import { quizFallback } from "../../utils/materialNavigation";

export default function QuizDetailPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    quizApi
      .get(id)
      .then(setQuiz)
      .catch((e) => setError(apiError(e, "Không thể tải bài kiểm tra")));
  }, [id]);
  if (error)
    return (
      <main className="container py-5">
        <ErrorState error={error} actions={[quizFallback]} />
      </main>
    );
  if (!quiz) return <LoadingState />;
  return (
    <MaterialShell
      lessonId={quiz.lessonId}
      type="QUIZ"
      materialId={quiz.id}
      title={quiz.title}
      fallback={quizFallback}
    >
      <main className="container py-4 assessment-detail-shell">
        <section className="assessment-detail-card">
          <span className="assessment-type">{quizKindLabel(quiz)}</span>
          <h1>{quiz.title}</h1>
          <p>{quiz.description || "Bài kiểm tra giúp bạn đánh giá mức độ nắm vững kiến thức."}</p>
          <div className="assessment-stat-grid">
            <div>
              <strong>{quiz.totalQuestion}</strong>
              <span>Câu hỏi</span>
            </div>
            <div>
              <strong>{quiz.timeLimitMinutes}</strong>
              <span>Phút</span>
            </div>
            <div>
              <strong>{quiz.courseTitle || "Tổng hợp"}</strong>
              <span>Khóa học</span>
            </div>
          </div>
          <div className="assessment-instructions">
            <h2>Lưu ý trước khi bắt đầu</h2>
            <ul>
              <li>Đồng hồ sẽ chạy ngay khi bạn nhấn bắt đầu.</li>
              <li>Mỗi câu hỏi chỉ có một đáp án đúng.</li>
              <li>Bạn có thể thay đổi lựa chọn trước khi nộp bài.</li>
              <li>Hệ thống tự động chấm điểm và hiển thị phần giải thích.</li>
            </ul>
          </div>
          {quiz.bestScore != null && (
            <p className="assessment-best">
              Điểm tốt nhất của bạn: <strong>{formatPercent(quiz.bestScore)}</strong>
            </p>
          )}
          <div className="d-flex flex-wrap gap-2">
            {quiz.lastAttemptId && (
              <Link
                className="btn btn-outline-secondary btn-lg"
                to={`/quiz/${quiz.id}/result/${quiz.lastAttemptId}`}
              >
                Xem kết quả gần nhất
              </Link>
            )}
            <Link className="btn btn-primary btn-lg" to={`/quiz/${quiz.id}/test`}>
              {quiz.inProgressAttemptId
                ? "Tiếp tục lượt đang làm"
                : quiz.lastAttemptId
                  ? "Làm lại"
                  : "Bắt đầu làm bài"}
            </Link>
          </div>
        </section>
      </main>
    </MaterialShell>
  );
}
