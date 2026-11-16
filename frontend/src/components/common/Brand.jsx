import { Link } from "react-router-dom";

/** Logo: một hàng ô tròn của phiếu trả lời, một ô đã tô — chọn đúng đáp án. */
function AnswerMark() {
  return (
    <svg className="app-brand-mark" viewBox="0 0 34 14" aria-hidden="true">
      <circle cx="5" cy="7" r="4.25" />
      <circle cx="17" cy="7" r="4.25" className="is-filled" />
      <circle cx="29" cy="7" r="4.25" />
    </svg>
  );
}

export default function Brand({ to = "/", compact = false, light = false }) {
  return (
    <Link
      className={`app-brand${compact ? " compact" : ""}${light ? " light" : ""}`}
      to={to}
      aria-label="TOEIC Path - Trang chủ"
    >
      <AnswerMark />
      {!compact && <span className="app-brand-name">TOEIC Path</span>}
    </Link>
  );
}
