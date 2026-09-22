import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
export default function UserLayout(){
 const {user,logout}=useAuth();
 return <>
  <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top shadow-sm-sm">
   <div className="container py-2">
    <Link className="navbar-brand fw-bold text-primary" to="/">TOEIC Path</Link>
    <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
      <Link className="btn btn-link btn-sm" to="/packages">Gói học phí</Link>
      {user?.role === "TEACHER" && <Link className="btn btn-outline-primary btn-sm" to="/mentor">Quản lý mentor</Link>}
      {user?.role === "ADMIN" && <Link className="btn btn-outline-primary btn-sm" to="/admin/payments">Xác nhận học phí</Link>}
      {user?.role === "STUDENT" && <>
        <Link className="btn btn-link btn-sm" to="/user/classes">Lớp của tôi</Link>
        <Link className="btn btn-link btn-sm" to="/user/payment">Gói đã đăng ký</Link>
      </>}
      {user ? <>
        <span className="d-none d-md-inline text-secondary small">Xin chào, <b>{user.fullName}</b></span>
        <Link className="btn btn-outline-primary btn-sm" to="/user/profile">Hồ sơ</Link>
        <button className="btn btn-dark btn-sm" onClick={logout}>Đăng xuất</button>
      </> : <>
        <Link className="btn btn-outline-primary btn-sm" to="/login">Đăng nhập</Link>
        <Link className="btn btn-primary btn-sm" to="/register">Đăng ký</Link>
      </>}
    </div>
   </div>
  </nav>
  <main><Outlet /></main>
 </>;
}
