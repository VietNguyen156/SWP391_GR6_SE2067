import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { finalTestApi } from "../../services/finalTestService";
import { formatDateTime } from "../../utils/format";

export default function ResultHistoryPage() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    finalTestApi
      .studentResults()
      .then(setResults)
      .catch((e) => setError(e.response?.data?.message || "Không thể tải kết quả Test"));
  }, []);
  return (
    <main className="container py-5 content-shell">
      <h1 className="h2 mb-4">Test cuối khóa</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {!results && !error && <p>Đang tải kết quả…</p>}
      {results?.length === 0 && <p>Bạn chưa làm Test cuối khóa nào.</p>}
      <div className="d-grid gap-2">
        {results?.map((item) => (
          <Link
            className="card p-3 text-decoration-none"
            key={item.id}
            to={`/courses/${item.course_id}/test/attempts/${item.id}`}
          >
            <strong>{item.title}</strong>
            <small className="text-muted">
              {formatDateTime(item.submitted_at || item.started_at)} ·{" "}
              {item.status === "PENDING_GRADING"
                ? "Chờ chấm Speaking"
                : item.status === "IN_PROGRESS"
                  ? "Đang làm"
                  : `${item.earned_points}/${item.total_points} điểm · ${item.passed ? "Đạt" : "Chưa đạt"}`}
            </small>
          </Link>
        ))}
      </div>
    </main>
  );
}
