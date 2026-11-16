import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminSidebar from "../components/admin/AdminSidebar";
import Brand from "../components/common/Brand";
import Icon from "../components/common/Icon";

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
      <nav className={`admin-topbar${isScrolled ? " is-scrolled" : ""}`}>
        <Brand to="/admin" light />
        <div className="admin-account">
          <Link to="/admin/profile">
            <span className="user-avatar">{user?.fullName?.charAt(0)?.toUpperCase() || "A"}</span>
            <span>
              <small>Administrator</small>
              <strong>{user?.fullName}</strong>
            </span>
          </Link>
          <button className="icon-button" onClick={logout} title="Đăng xuất">
            <Icon name="logout" />
          </button>
        </div>
      </nav>
      <div className="admin-shell">
        <AdminSidebar />
        <main className="admin-main">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
