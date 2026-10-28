import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../../components/common/LoadingState";
import { formatNumber, formatPercent } from "../../utils/format";
import Icon from "../../components/common/Icon";
import ProgressBar from "../../components/common/ProgressBar";
import LearningChart from "../../components/progress/LearningChart";
import RecentActivity from "../../components/progress/RecentActivity";
import {
  FadeIn,
  HoverLift,
  StaggerContainer,
  StaggerItem,
} from "../../components/animations/MotionWrappers";
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

  const courses = data.progress.courses || [];
  const activeCourse = courses[0];

  return (
    <main className="container py-4 dashboard-shell">
      {/* Tiêu đề & Lối tắt */}
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Tổng quan học tập</h1>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-secondary" to="/results?tab=progress">
            Chi tiết tiến độ
          </Link>
          <Link
            className="btn btn-primary"
            to={activeCourse?.courseId ? `/courses/${activeCourse.courseId}` : "/courses"}
          >
            {activeCourse?.courseId ? "Tiếp tục học ngay →" : "Khám phá khóa học"}
          </Link>
        </div>
      </div>

      {/* Khối Học tiếp nổi bật */}
      {activeCourse && (
        <FadeIn delay={0.1}>
          <section className="db-continue-banner mb-4">
            <div className="db-continue-content">
              <span className="db-continue-badge">Khóa học đang học</span>
              <h2 className="db-continue-title">{activeCourse.courseTitle}</h2>
              <div className="db-continue-meta">
                <span>
                  Đã hoàn thành <strong>{activeCourse.completedLessons}</strong> /{" "}
                  {activeCourse.totalLessons} bài học
                </span>
                <div className="db-continue-bar">
                  <ProgressBar
                    value={activeCourse.percentage != null ? Number(activeCourse.percentage) : 0}
                    max={100}
                    variant="primary"
                    size="sm"
                  />
                </div>
              </div>
            </div>
            <Link
              className="btn btn-primary btn-lg db-continue-btn"
              to={`/courses/${activeCourse.courseId}`}
            >
              Vào bài học →
            </Link>
          </section>
        </FadeIn>
      )}

      {/* Dải 4 số liệu trọng tâm: Tiến độ, Chuỗi ngày học, Điểm Test TB, Thẻ đã ôn */}
      <StaggerContainer
        className="db-metrics-row mb-4"
        aria-label="Chỉ số học tập trọng tâm"
        stagger={0.08}
        delayChildren={0.15}
      >
        <StaggerItem>
          <div className="db-metric-card">
            <div className="db-metric-icon icon-progress">
              <Icon name="reports" size={22} />
            </div>
            <div className="db-metric-info">
              <span className="db-metric-label">Tiến độ chung</span>
              <strong className="db-metric-val">
                {formatPercent(data.progress.courseProgress || 0)}
              </strong>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="db-metric-card">
            <div className="db-metric-icon icon-streak">
              <Icon name="sparkle" size={22} />
            </div>
            <div className="db-metric-info">
              <span className="db-metric-label">Chuỗi ngày học</span>
              <strong className="db-metric-val">{data.progress.learningStreak || 0} ngày</strong>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="db-metric-card">
            <div className="db-metric-icon icon-test">
              <Icon name="test" size={22} />
            </div>
            <div className="db-metric-info">
              <span className="db-metric-label">Điểm Test TB</span>
              <strong className="db-metric-val">
                {formatNumber(data.progress.testAverageScore || 0)}%
              </strong>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="db-metric-card">
            <div className="db-metric-icon icon-flashcard">
              <Icon name="cards" size={22} />
            </div>
            <div className="db-metric-info">
              <span className="db-metric-label">Thẻ từ đã ôn</span>
              <strong className="db-metric-val">{data.progress.flashcardsReviewed || 0} thẻ</strong>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Danh sách khóa đang học */}
      {courses.length > 0 && (
        <section className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold m-0">Khóa học đang theo học</h2>
            <Link to="/courses" className="text-primary small fw-semibold">
              Xem tất cả ({courses.length}) →
            </Link>
          </div>
          <div className="row g-3">
            {courses.map((c) => (
              <div className="col-md-6 col-lg-4" key={c.courseId}>
                <div className="ui-card p-3 h-100 d-flex flex-direction-column justify-content-between">
                  <div>
                    <span className="badge-primary mb-2">Đang học</span>
                    <h3 className="h6 fw-bold mb-2">{c.courseTitle}</h3>
                    <p className="text-muted small mb-3">
                      Hoàn thành {c.completedLessons}/{c.totalLessons} bài học
                    </p>
                  </div>
                  <div>
                    <ProgressBar
                      value={c.percentage != null ? Number(c.percentage) : 0}
                      max={100}
                      variant="primary"
                      size="sm"
                      className="mb-3"
                    />
                    <Link to={`/courses/${c.courseId}`} className="btn btn-secondary btn-sm w-100">
                      Học tiếp
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Biểu đồ hoạt động & Lịch sử học gần đây */}
      <div className="row g-4">
        <div className="col-lg-7">
          <LearningChart data={data.statistics.weekly} />
        </div>
        <div className="col-lg-5">
          <RecentActivity activities={data.history} limit={6} />
          <div className="text-end mt-2">
            <Link to="/results?tab=history" className="text-primary small fw-semibold">
              Xem toàn bộ lịch sử →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
