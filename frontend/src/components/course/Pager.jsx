import { Link } from "react-router-dom";

/** ‹ trước · sau › giữa các tuần hoặc bài. previous/next: { to, label } hoặc null (ẩn nút đó). */
export default function Pager({ previous, next }) {
  if (!previous && !next) return null;
  return (
    <nav className="tc-pager" aria-label="Chuyển trang">
      {previous && (
        <Link className="btn btn-outline-secondary btn-sm" to={previous.to}>
          ‹ {previous.label}
        </Link>
      )}
      {next && (
        <Link className="btn btn-outline-secondary btn-sm" to={next.to}>
          {next.label} ›
        </Link>
      )}
    </nav>
  );
}
