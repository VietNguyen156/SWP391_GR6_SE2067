import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon";

const links = [
  ["/teacher/dashboard", "Dashboard", "dashboard"],
  ["/teacher/courses", "Khóa học", "book"],
  ["/teacher/classes", "Lớp học", "users"],
  ["/teacher/questions", "Ngân hàng đề thi", "question"],
  ["/teacher/library", "Thư viện học liệu", "cards"],
];

// Trang tuần và trang bài học thuộc mục Khóa học (bài học nằm ở /teacher/lessons).
const alsoActive = { "/teacher/courses": ["/teacher/lessons"] };

export default function TeacherSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="teacher-sidebar" aria-label="Điều hướng giáo viên">
      <div className="teacher-sidebar-brand">
        <strong>Trung tâm giảng dạy</strong>
      </div>
      <nav>
        <section>
          {links.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive || (alsoActive[to] || []).some((path) => pathname.startsWith(`${path}/`))
                  ? "active"
                  : ""
              }
            >
              <Icon name={icon} size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </section>
      </nav>
    </aside>
  );
}
