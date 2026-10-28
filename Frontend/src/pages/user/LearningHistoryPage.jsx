import { useEffect, useState } from "react";
import RecentActivity from "../../components/progress/RecentActivity";
import { progressApi } from "../../services/progressService";
export default function LearningHistoryPage() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    progressApi
      .history()
      .then(setHistory)
      .catch((e) => setError(e.response?.data?.message || "Không thể tải lịch sử"));
  }, []);
  return (
    <main className="container py-5 history-shell">
      <div className="mb-4">
        <h1 className="h2 fw-bold">Lịch sử học tập</h1>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {history ? (
        <RecentActivity activities={history} />
      ) : (
        !error && <div className="spinner-border text-primary" />
      )}
    </main>
  );
}
