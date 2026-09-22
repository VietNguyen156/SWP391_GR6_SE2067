import { NavLink, Outlet } from "react-router-dom";
export default function MentorLayout() {
  return <div className="container py-4">
    <h1 className="h3">Không gian mentor</h1>
    <nav className="nav nav-pills gap-2 my-4">
      <NavLink className="nav-link" to="/mentor/packages">Gói học phí</NavLink>
      <NavLink className="nav-link" to="/mentor/classes">Lớp học</NavLink>
    </nav>
    <Outlet />
  </div>;
}
