import Icon from "../common/Icon";
const icons = {
  "Tổng người dùng": "users",
  "Học viên": "profile",
  "Giáo viên": "book",
  "Khóa học": "courses",
  Quiz: "quiz",
  "Bài học": "vocab",
  "Bài học hoàn thành": "book",
  "Quiz hoàn thành": "quiz",
  "Điểm quiz trung bình": "results",
  "Người dùng hoạt động": "users",
};
export default function ReportCard({ label, value, unit, tone = "blue" }) {
  return (
    <article className={`admin-report-card ${tone}`}>
      <div className="admin-report-icon">
        <Icon name={icons[label] || "reports"} />
      </div>
      <span>{label}</span>
      <strong>
        {value ?? 0}
        {unit && <small>{unit}</small>}
      </strong>
      <i />
    </article>
  );
}
