import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
export default function RequireRole({ role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <div className="container py-5"><h1 className="h4">Bạn không có quyền truy cập trang này.</h1></div>;
  return <Outlet />;
}
