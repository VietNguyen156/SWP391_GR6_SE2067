import { Navigate, Outlet } from "react-router-dom";
import { motion } from "motion/react";
import Brand from "../components/common/Brand";
import { useAuth } from "../contexts/AuthContext";
import { homeForRole } from "../utils/roleNavigation";

// Cách app tổ chức việc học — nội dung thật, không số liệu minh họa.
const path = [
  ["Tuần", "Mỗi khóa chia theo tuần, có mục tiêu riêng."],
  ["Bài học", "Mỗi tuần vài bài, mở lần lượt khi hoàn thành bài trước."],
  ["Học liệu", "Ngữ pháp, flashcards, listening, reading và speaking."],
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
        <motion.div
          className="auth-story-content"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <h2>Học đúng trọng tâm. Tiến bộ thật sự.</h2>
          <p>Một hành trình học tập rõ ràng, cá nhân hóa và được đo lường qua từng bài học.</p>
          <ol className="auth-path">
            {path.map(([name, detail], idx) => (
              <motion.li
                key={name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 + idx * 0.06 }}
              >
                <strong>{name}</strong>
                <span>{detail}</span>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </aside>
      <main className="auth-content">
        <motion.div
          className="page-enter"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
