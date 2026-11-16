import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
          {/* Animated Tab Switcher */}
          <div className="auth-tabs">
            <Link to="/login" className="auth-tab active">
              <motion.div layoutId="auth-tab-pill" className="auth-tab-pill" />
              <span className="auth-tab-text">Đăng nhập</span>
            </Link>
            <Link to="/register" className="auth-tab">
              <span className="auth-tab-text">Đăng ký</span>
            </Link>
          </div>

          <div className="mb-4">
            <h1 className="h3 fw-bold">Đăng nhập</h1>
          </div>

          <AnimatePresence mode="wait">
            {reason === "session-expired" && (
              <motion.div
                key="session-expired"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="alert alert-warning"
              >
                Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
              </motion.div>
            )}
            {reason === "account-locked" && (
              <motion.div
                key="account-locked"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="alert alert-danger"
              >
                Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.
              </motion.div>
            )}
            {error && (
              <motion.div
                key="auth-error"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  x: [0, -6, 6, -3, 3, 0],
                  transition: { duration: 0.35 },
                }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="alert alert-danger"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit}>
            <div className="form-floating mb-3">
              <input
                id="login-email"
                className="form-control"
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
              <label htmlFor="login-email">Email</label>
            </div>

            <div className="form-floating mb-2">
              <input
                id="login-password"
                className="form-control"
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <label htmlFor="login-password">Mật khẩu</label>
            </div>

            <div className="d-flex justify-content-end mb-4">
              <Link className="small" to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </motion.button>
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
