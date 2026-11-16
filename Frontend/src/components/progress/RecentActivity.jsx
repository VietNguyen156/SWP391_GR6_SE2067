import { formatDateTime } from "../../utils/format";
const labels = {
  LESSON: "Bài học",
  GRAMMAR: "Ngữ pháp",
  VOCABULARY: "Từ vựng",
  FLASHCARD: "Flashcard",
  TEST: "Test cuối khóa",
};
export default function RecentActivity({ activities = [], limit }) {
  const items = limit ? activities.slice(0, limit) : activities;
  return (
    <article className="recent-activity-card">
      <div className="d-flex justify-content-between">
        <div>
          <span>Hoạt động</span>
          <h2>Học gần đây</h2>
        </div>
      </div>
      {items.map((item) => (
        <div className="recent-activity-row" key={item.id}>
          <b className={item.activityType.toLowerCase()}>{item.activityType.slice(0, 1)}</b>
          <div>
            <strong>{item.activityName}</strong>
            <small>
              {labels[item.activityType] || item.activityType} · {formatDateTime(item.createdAt)}
            </small>
          </div>
        </div>
      ))}
      {!items.length && <p className="dashboard-empty">Chưa có hoạt động học tập.</p>}
    </article>
  );
}
