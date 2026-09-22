import { Link, Outlet } from "react-router-dom";
export default function AuthLayout(){return <div className="auth-shell min-vh-100">
  <nav className="navbar bg-transparent"><div className="container"><Link className="navbar-brand fw-bold text-primary" to="/">TOEIC Path</Link></div></nav>
  <main className="container py-4 py-md-5"><Outlet /></main>
</div>}
