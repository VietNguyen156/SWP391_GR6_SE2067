import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { formatDateTime, formatNumber } from "../../utils/format";
import LearningChart from "../../components/progress/LearningChart";
import ProgressCard from "../../components/progress/ProgressCard";
import StatisticCard from "../../components/progress/StatisticCard";
import { progressApi } from "../../services/progressService";

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([progressApi.overall(), progressApi.statistics()])
      .then(([progress, statistics]) => setData({ progress, statistics }))
      .catch((e) => setError(e.response?.data?.message || "Không thể tải tiến độ"));
  }, []);
  if (error)
    return (
      <main className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  if (!data) return <LoadingState />;
  return (
    <main className="container py-5 dashboard-shell">
      <div className="mb-4">
        <h1 className="h2 fw-bold">Tiến độ của bạn</h1>
      </div>
      <div className="dashboard-stat-grid">
        <StatisticCard
          label="Tổng tiến độ"
          value={formatNumber(data.progress.courseProgress)}
          unit="%"
        />
        <StatisticCard
          label="Bài học"
          value={`${data.progress.lessonCompleted}/${data.progress.totalLesson}`}
          tone="green"
        />
        <StatisticCard
          label="Flashcard đã ôn"
          value={data.progress.flashcardsReviewed}
          tone="purple"
        />
        <StatisticCard
          label="Phút học tháng này"
          value={data.statistics.monthlyLearningMinutes}
          tone="orange"
        />
      </div>
      <section className="course-progress-list">
        <h2>Tiến độ theo khóa học</h2>
        {data.progress.courses.map((course) => (
          <ProgressCard
            key={course.courseId}
            title={course.courseTitle}
            percentage={course.percentage}
            subtitle={`${course.completedLessons} hoàn thành · ${course.remainingLessons} còn lại · Cập nhật ${formatDateTime(course.lastLearningTime, "chưa có")}`}
          />
        ))}
        {!data.progress.courses.length && (
          <div className="content-empty">Chưa có tiến độ khóa học.</div>
        )}
      </section>
      <LearningChart data={data.statistics.monthly} />
    </main>
  );
}
