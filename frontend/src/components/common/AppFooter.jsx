import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Brand from "./Brand";

export default function AppFooter() {
  const { user } = useAuth();
  const links =
    user?.role === "TEACHER"
      ? [
          ["/teacher/dashboard", "Dashboard"],
          ["/teacher/courses", "Khóa học"],
          ["/teacher/questions", "Ngân hàng câu hỏi"],
          ["/teacher/library", "Thư viện học liệu"],
        ]
      : user?.role === "STUDENT"
        ? [
            ["/courses", "Khóa học của tôi"],
            ["/review", "Ôn tập"],
            ["/results", "Kết quả"],
          ]
        : [
            ["/", "Trang chủ"],
            ["/login", "Đăng nhập"],
            ["/register", "Đăng ký miễn phí"],
          ];
  return (
    <footer className="app-footer">
      <div className="container app-footer-main">
        <Brand compact />
        <p>Nền tảng học TOEIC có hệ thống, giúp bạn tiến bộ bền vững mỗi ngày.</p>
        <nav className="app-footer-links" aria-label="Liên kết cuối trang">
          {links.map(([to, label]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <small className="app-footer-year">© 2026 TOEIC Path</small>
      </div>
    </footer>
  );
}
