import { Navigate, Outlet } from "react-router-dom";
import Brand from "../components/common/Brand";
import { useAuth } from "../contexts/AuthContext";
import { homeForRole } from "../utils/roleNavigation";

// Cách app tổ chức việc học — nội dung thật, không số liệu minh họa.
const path = [
  ["Tuần", "Mỗi khóa chia theo tuần, có mục tiêu riêng."],
  ["Bài học", "Mỗi tuần vài bài, mở lần lượt khi hoàn thành bài trước."],
  ["Học liệu", "Bài giảng, ngữ pháp, flashcards, listening, speaking, quiz."],
  ["Kết quả", "Điểm, lịch sử và câu sai được lưu để ôn đúng chỗ."],
];

export default function AuthLayout() {
  const { user, initializing } = useAuth();
  // Đã đăng nhập thì không hiện lại form đăng nhập/đăng ký.
  if (user && !initializing) return <Navigate to={homeForRole(user.role)} replace />;
  return (
    <div className="auth-shell">
      <header className="auth-brand">
        <Brand />
      </header>
      <aside className="auth-story">
        <div className="auth-story-content">
          <h2>Học đúng trọng tâm. Tiến bộ thật sự.</h2>
          <p>Một hành trình học tập rõ ràng, cá nhân hóa và được đo lường qua từng bài học.</p>
          <ol className="auth-path">
            {path.map(([name, detail]) => (
              <li key={name}>
                <strong>{name}</strong>
                <span>{detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
      <main className="auth-content">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
