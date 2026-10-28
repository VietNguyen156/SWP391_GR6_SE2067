import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user, initializing, sessionError, verifySession, signOut } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <main className="container py-5 text-center" aria-live="polite">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-secondary mt-3">Đang kiểm tra phiên đăng nhập…</p>
      </main>
    );
  }
  if (sessionError) {
    return (
      <main className="container py-5 text-center">
        <p className="alert alert-warning">{sessionError}</p>
        <button className="btn btn-primary me-2" onClick={verifySession}>
          Thử lại
        </button>
        <button className="btn btn-outline-secondary" onClick={signOut}>
          Đăng xuất
        </button>
      </main>
    );
  }
  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
