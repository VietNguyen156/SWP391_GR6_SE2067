import { useEffect, useMemo, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { formatDateTime, formatPercent, formatNumber } from "../../utils/format";
import { Link, useParams } from "react-router-dom";
import { classroomApi } from "../../services/classroomService";

const typeLabel = {
  GRAMMAR: "Ngữ pháp",
  FLASHCARD: "Flashcard",
  LISTENING: "Listening",
  READING: "Reading",
  SPEAKING: "Speaking",
};
const stateLabel = {
  GRADED: "Đã chấm",
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Đã nộp",
  COMPLETED: "Hoàn thành",
};

export default function StudentClassDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    classroomApi
      .studentProgress(id)
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || "Không thể tải tiến độ học tập"));
  }, [id]);

  const overall = useMemo(() => {
    if (!data?.summary?.totalContent) return 0;
    return Math.round((data.summary.completedContent * 100) / data.summary.totalContent);
  }, [data]);

  if (error)
    return (
      <main className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  if (!data) return <LoadingState />;

  return (
    <main className="container py-5 course-shell student-progress-page">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
        <Link to="/courses">← Khóa học của tôi</Link>
        <Link className="btn btn-primary" to={`/courses/${data.courseId}`}>
          Vào khóa học
        </Link>
      </div>

      <section className="student-progress-hero">
        <div>
          <p>Tiến độ học tập</p>
          <h1>{data.className}</h1>
          <span>{data.courseTitle}</span>
        </div>
        <div className="student-progress-overall">
          <strong>{overall}%</strong>
          <span>Hoàn thành</span>
        </div>
      </section>

      <section className="student-progress-summary">
        <article>
          <span>Nội dung đã học</span>
          <strong>
            {data.summary.completedContent}/{data.summary.totalContent}
          </strong>
        </article>
        <article>
          <span>Bài đã nộp</span>
          <strong>{data.summary.submittedCount}</strong>
        </article>
        <article>
          <span>Đã chấm</span>
          <strong>{data.summary.gradedCount}</strong>
        </article>
        <article>
          <span>Điểm TB hiện tại</span>
          <strong>{formatNumber(data.summary.averageScore || 0)}</strong>
        </article>
      </section>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <section className="student-progress-panel h-100">
            <div className="student-progress-panel-head">
              <div>
                <span>Lộ trình</span>
                <h2>Tiến độ theo tuần</h2>
              </div>
              <small>{data.weeks.length} tuần</small>
            </div>
            <div className="student-week-progress-list">
              {data.weeks.map((w) => (
                <article key={w.weekId}>
                  <div>
                    <strong>Tuần {w.weekNumber}</strong>
                    <span>
                      {w.completed}/{w.total} nội dung
                    </span>
                    <b>{formatPercent(w.percentage || 0)}</b>
                  </div>
                  <div className="student-week-track">
                    <i style={{ width: `${Math.min(100, Number(w.percentage || 0))}%` }} />
                  </div>
                  {w.title && w.title !== `Tuần ${w.weekNumber}` && <small>{w.title}</small>}
                </article>
              ))}
              {!data.weeks.length && (
                <div className="content-empty">Khóa học chưa có tuần học.</div>
              )}
            </div>
          </section>
        </div>

        <div className="col-lg-5">
          <section className="student-progress-panel h-100">
            <div className="student-progress-panel-head">
              <div>
                <span>Kết quả</span>
                <h2>Theo loại học liệu</h2>
              </div>
            </div>
            <div className="student-type-progress-list">
              {data.types.map((item) => (
                <article key={item.type}>
                  <div>
                    <strong>{typeLabel[item.type] || item.label}</strong>
                    <span>
                      {item.completed}/{item.total}
                    </span>
                  </div>
                  {item.graded !== null && item.graded !== undefined && (
                    <small>
                      {item.graded} bài đã có điểm
                      {item.averageScore !== null && item.averageScore !== undefined
                        ? ` · Điểm TB ${formatNumber(item.averageScore)}`
                        : ""}
                    </small>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="student-progress-panel mt-4">
        <div className="student-progress-panel-head">
          <div>
            <span>Hoạt động</span>
            <h2>Bài gần đây</h2>
          </div>
        </div>
        <div className="student-recent-table">
          {data.recentItems.map((item, index) => (
            <article key={`${item.type}-${index}-${item.occurredAt || ""}`}>
              <span className={`student-recent-type ${item.type.toLowerCase()}`}>
                {typeLabel[item.type] || item.type}
              </span>
              <div>
                <strong>{item.title}</strong>
                <small>{formatDateTime(item.occurredAt, "")}</small>
              </div>
              <span className={`student-recent-status ${String(item.status || "").toLowerCase()}`}>
                {stateLabel[item.status] || item.status}
              </span>
              <strong className="student-recent-score">
                {item.score !== null && item.score !== undefined ? item.score : "—"}
              </strong>
            </article>
          ))}
          {!data.recentItems.length && (
            <div className="content-empty">Chưa có bài làm gần đây.</div>
          )}
        </div>
      </section>
    </main>
  );
}
