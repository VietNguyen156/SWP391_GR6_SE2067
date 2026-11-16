import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { formatNumber } from "../../utils/format";
import { Link } from "react-router-dom";
import LearningChart from "../../components/progress/LearningChart";
import ProgressCard from "../../components/progress/ProgressCard";
import RecentActivity from "../../components/progress/RecentActivity";
import StatisticCard from "../../components/progress/StatisticCard";
import { progressApi } from "../../services/progressService";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([progressApi.overall(), progressApi.history(), progressApi.statistics()])
      .then(([progress, history, statistics]) => setData({ progress, history, statistics }))
      .catch((e) => setError(e.response?.data?.message || "Không thể tải dashboard"));
  }, []);
  if (error)
    return (
      <main className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  if (!data) return <LoadingState />;
  const current = data.progress.courses[0];
  return (
    <main className="container py-5 dashboard-shell">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Tổng quan học tập</h1>
          <p className="text-secondary mb-0">Theo dõi tiến bộ và duy trì nhịp học mỗi ngày.</p>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-primary" to="/results?tab=progress">
            Chi tiết tiến độ
          </Link>
          <Link
            className="btn btn-primary"
            to={current?.courseId ? `/courses/${current.courseId}` : "/courses"}
          >
            {current?.courseId ? "Tiếp tục khóa học" : "Chọn khóa học"}
          </Link>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-lg-8">
          <ProgressCard
            title={current?.courseTitle || "Hành trình TOEIC"}
            percentage={current?.percentage ?? data.progress.courseProgress}
            subtitle={
              current
                ? `${current.completedLessons}/${current.totalLessons} bài học đã hoàn thành`
                : "Hoàn thành bài học đầu tiên để bắt đầu theo dõi."
            }
          />
        </div>
        <div className="col-lg-4">
          <article className="streak-card">
            <span>Chuỗi học tập</span>
            <strong>{data.progress.learningStreak}</strong>
            <p>ngày liên tục</p>
          </article>
        </div>
      </div>
      <div className="dashboard-stat-grid">
        <StatisticCard
          label="Bài học hoàn thành"
          value={data.progress.lessonCompleted}
          tone="blue"
        />
        <StatisticCard
          label="Ngữ pháp hoàn thành"
          value={data.progress.grammarCompleted}
          tone="purple"
        />
        <StatisticCard
          label="Điểm quiz trung bình"
          value={formatNumber(data.progress.quizAverageScore)}
          unit="%"
          tone="orange"
        />
      </div>
      <div className="row g-4">
        <div className="col-lg-7">
          <LearningChart data={data.statistics.weekly} />
        </div>
        <div className="col-lg-5">
          <RecentActivity activities={data.history} limit={6} />
          <div className="text-end mt-2">
            <Link to="/results?tab=history">Xem toàn bộ lịch sử →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
