import { Link, Outlet } from "react-router-dom";
export default function AdminLayout() {
  return <><nav className="navbar navbar-dark bg-dark px-4"><Link className="navbar-brand" to="/">TOEIC Path</Link><span className="text-white">Admin · Quản lý hệ thống</span></nav><main className="container py-4"><Outlet /></main></>;
}
