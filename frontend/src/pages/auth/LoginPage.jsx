import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSuccessToast } from "../../components/common/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { loginDestination } from "../../utils/roleNavigation";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const reason = query.get("reason");
  // Trang định vào: từ ProtectedRoute (state) hoặc từ lần hết phiên (query ?from=).
  const requestedPath = location.state?.from || query.get("from");
  useSuccessToast(location.state?.message);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await signIn(form);
      navigate(loginDestination(data.user.role, requestedPath), {
        replace: true,
        state: null,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể đăng nhập");
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-5">
        <div className="card auth-card border-0 p-4 p-md-5">
          <div className="mb-4">
            <h1 className="h3 fw-bold">Đăng nhập</h1>
            <p className="text-secondary mb-0">Tiếp tục khóa học TOEIC của bạn.</p>
          </div>
          {reason === "session-expired" && (
            <div className="alert alert-warning">
              Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
            </div>
          )}
          {reason === "account-locked" && (
            <div className="alert alert-danger">
              Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.
            </div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <label className="form-label fw-semibold" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="form-control form-control-lg mb-3"
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <div className="d-flex justify-content-between">
              <label className="form-label fw-semibold" htmlFor="login-password">
                Mật khẩu
              </label>
              <Link className="small" to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              id="login-password"
              className="form-control form-control-lg mb-4"
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button className="btn btn-primary btn-lg w-100" disabled={loading}>
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
          <p className="text-center mt-4 mb-0 text-secondary">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="fw-semibold">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
