import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppFooter from "../components/common/AppFooter";
import Brand from "../components/common/Brand";
import Icon from "../components/common/Icon";
import TeacherSidebar from "../components/common/TeacherSidebar";
import { roleLabel } from "../utils/statusLabels";

const studentLinks = [
  ["/dashboard", "Trang chủ", "home"],
  ["/courses", "Khóa học của tôi", "book"],
  ["/flashcards", "Flashcard", "cards"],
  ["/results", "Kết quả", "results"],
];

export default function UserLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isExam =
    /^\/(?:courses\/[^/]+\/test\/attempts\/[^/]+|reading\/[^/]+|listening\/[^/]+|speaking\/[^/]+|flashcards\/[^/]+)\/?$/.test(
      location.pathname,
    );
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [location.pathname]);
  const isTeacher = user?.role === "TEACHER";
  // Trang chủ (logo) hiện giống học viên; mọi trang khác của giáo viên nằm trong khung giảng dạy.
  const inStudio = isTeacher && location.pathname !== "/";
  // Giáo viên điều hướng bằng TeacherSidebar; thanh trên chỉ có menu học viên.
  const links = user?.role === "STUDENT" ? studentLinks : [];
  const profilePath =
    user?.role === "TEACHER"
      ? "/teacher/profile"
      : user?.role === "ADMIN"
        ? "/admin/profile"
        : "/user/profile";
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  async function logout() {
    await signOut();
    navigate("/login", { replace: true, state: { message: "Bạn đã đăng xuất thành công." } });
  }
  return (
    <>
      <nav
        className={`app-navbar sticky-top${isScrolled ? " is-scrolled" : ""}${isExam ? " is-exam-nav" : ""}`}
      >
        <div className="container app-navbar-inner">
          <Brand />
          {!isExam && !isTeacher && links.length > 0 && (
            <div className="desktop-nav">
              {links.map(([to, label, icon]) => (
                <NavLink key={to} to={to}>
                  <Icon name={icon} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}
          {!isExam && (
            <div className="app-navbar-actions">
              {user ? (
                <>
                  {isTeacher && (
                    <Link className="teacher-mode-chip" to="/teacher/dashboard">
                      Teacher Studio
                    </Link>
                  )}
                  <Link className="user-chip" to={profilePath}>
                    <span className="user-avatar">
                      {user.fullName?.trim()?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    <span>
                      <small>{roleLabel(user.role)}</small>
                      <strong>{user.fullName}</strong>
                    </span>
                  </Link>
                  <button
                    className="icon-button d-none d-lg-grid"
                    onClick={logout}
                    title="Đăng xuất"
                  >
                    <Icon name="logout" />
                  </button>
                  {!isTeacher && links.length > 0 && (
                    <button
                      className="icon-button mobile-menu-button"
                      onClick={() => setOpen(!open)}
                      aria-label="Mở menu"
                    >
                      <Icon name={open ? "close" : "menu"} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link className="nav-login" to="/login">
                    Đăng nhập
                  </Link>
                  <Link className="btn btn-primary nav-cta" to="/register">
                    Học miễn phí <Icon name="arrow" size={17} />
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
        {user && !isTeacher && !isExam && (
          <div className={`mobile-nav${open ? " open" : ""}`}>
            <div className="container">
              {links.map(([to, label, icon]) => (
                <NavLink key={to} to={to}>
                  <Icon name={icon} />
                  <span>{label}</span>
                </NavLink>
              ))}
              <Link to={profilePath}>
                <Icon name="profile" />
                <span>Hồ sơ cá nhân</span>
              </Link>
              <button onClick={logout}>
                <Icon name="logout" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className={`app-content${inStudio ? " teacher-app-content" : ""}`}>
        {inStudio ? (
          <div className="teacher-workspace">
            <TeacherSidebar />
            <div className="teacher-workspace-main">
              <div className="page-enter" key={location.pathname}>
                <Outlet />
              </div>
            </div>
          </div>
        ) : (
          <div className="page-enter" key={location.pathname}>
            <Outlet />
          </div>
        )}
      </main>
      {!inStudio && !isExam && <AppFooter />}
    </>
  );
}
