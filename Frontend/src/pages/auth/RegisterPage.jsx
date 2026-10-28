import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    try {
      const { confirmPassword, ...payload } = form;
      await signUp(payload);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể đăng ký");
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card auth-card border-0 p-4 p-md-5">
          {/* Animated Tab Switcher */}
          <div className="auth-tabs">
            <Link to="/login" className="auth-tab">
              <span className="auth-tab-text">Đăng nhập</span>
            </Link>
            <Link to="/register" className="auth-tab active">
              <motion.div layoutId="auth-tab-pill" className="auth-tab-pill" />
              <span className="auth-tab-text">Đăng ký</span>
            </Link>
          </div>

          <div className="mb-4">
            <h1 className="h3 fw-bold">Tạo tài khoản học viên</h1>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="register-error"
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

          <form onSubmit={submit} className="row g-3">
            <div className="col-12">
              <div className="form-floating">
                <input
                  id="register-name"
                  className="form-control"
                  name="fullName"
                  maxLength="150"
                  value={form.fullName}
                  onChange={change}
                  required
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                />
                <label htmlFor="register-name">Họ và tên</label>
              </div>
            </div>

            <div className="col-md-7">
              <div className="form-floating">
                <input
                  id="register-email"
                  className="form-control"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={change}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
                <label htmlFor="register-email">Email</label>
              </div>
            </div>

            <div className="col-md-5">
              <div className="form-floating">
                <input
                  id="register-phone"
                  className="form-control"
                  name="phone"
                  maxLength="30"
                  value={form.phone}
                  onChange={change}
                  autoComplete="tel"
                  placeholder="0912345678"
                />
                <label htmlFor="register-phone">Số điện thoại</label>
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-floating">
                <input
                  id="register-password"
                  className="form-control"
                  type="password"
                  minLength="8"
                  maxLength="72"
                  name="password"
                  value={form.password}
                  onChange={change}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <label htmlFor="register-password">Mật khẩu</label>
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-floating">
                <input
                  id="register-confirm"
                  className="form-control"
                  type="password"
                  minLength="8"
                  maxLength="72"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={change}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <label htmlFor="register-confirm">Xác nhận mật khẩu</label>
              </div>
            </div>

            <div className="col-12 mt-4">
              <motion.button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Đang tạo tài khoản…" : "Đăng ký"}
              </motion.button>
            </div>
          </form>

          <p className="text-center mt-4 mb-0 text-secondary">
            Đã có tài khoản?{" "}
            <Link to="/login" className="fw-semibold">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
