/** Khung xương (skeleton) thay cho spinner toàn trang. rows: số dòng giả lập nội dung. */
export default function LoadingState({ rows = 3, label = "Đang tải" }) {
  return (
    <div className="container py-5" role="status" aria-live="polite" aria-label={label}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton-grid">
        {Array.from({ length: rows }, (_, index) => (
          <div className="skeleton skeleton-card" key={index} />
        ))}
      </div>
      <span className="visually-hidden">{label}...</span>
    </div>
  );
}
