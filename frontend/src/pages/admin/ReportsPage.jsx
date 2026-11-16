import { useEffect, useState } from "react";
import { formatNumber } from "../../utils/format";
import ReportCard from "../../components/admin/ReportCard";
import { adminApi } from "../../services/adminService";
export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi
      .reports()
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || "Không thể tải báo cáo"));
  }, []);
  return (
    <>
      <header className="admin-page-header">
        <h1>Báo cáo học tập</h1>
        <p>Thống kê tổng hợp từ tiến độ và kết quả quiz toàn hệ thống.</p>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      {data ? (
        <div className="admin-overview-grid reports">
          <ReportCard label="Bài học hoàn thành" value={data.totalLessonsCompleted} />
          <ReportCard label="Quiz hoàn thành" value={data.totalQuizzesCompleted} tone="purple" />
          <ReportCard
            label="Điểm quiz trung bình"
            value={formatNumber(data.averageQuizScore)}
            unit="%"
            tone="orange"
          />
          <ReportCard label="Người dùng hoạt động" value={data.activeUsers} tone="green" />
        </div>
      ) : (
        !error && <div className="spinner-border text-primary" />
      )}
    </>
  );
}
