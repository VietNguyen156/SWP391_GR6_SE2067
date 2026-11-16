import { formatPercent } from "../../utils/format";
export default function ProgressCard({ title, percentage = 0, subtitle }) {
  const value = Math.max(0, Math.min(100, Number(percentage) || 0));
  return (
    <article className="dashboard-progress-card">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <span>Tiến độ khóa học</span>
          <h2>{title || "Hành trình TOEIC"}</h2>
        </div>
        <strong>{formatPercent(value)}</strong>
      </div>
      <div className="dashboard-progress-track">
        <div style={{ width: `${value}%` }} />
      </div>
      <p>{subtitle || "Tiếp tục học để hoàn thành mục tiêu của bạn."}</p>
    </article>
  );
}
