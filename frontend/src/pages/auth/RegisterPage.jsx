import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
          <h1 className="h3 fw-bold">Tạo tài khoản học viên</h1>
          <p className="text-secondary mb-4">Đăng ký để bắt đầu học TOEIC ngay hôm nay.</p>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold" htmlFor="register-name">
                Họ và tên
              </label>
              <input
                id="register-name"
                className="form-control form-control-lg"
                name="fullName"
                maxLength="150"
                value={form.fullName}
                onChange={change}
                required
                autoComplete="name"
              />
            </div>
            <div className="col-md-7">
              <label className="form-label fw-semibold" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                className="form-control form-control-lg"
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                required
                autoComplete="email"
              />
            </div>
            <div className="col-md-5">
              <label className="form-label fw-semibold" htmlFor="register-phone">
                Số điện thoại
              </label>
              <input
                id="register-phone"
                className="form-control form-control-lg"
                name="phone"
                maxLength="30"
                value={form.phone}
                onChange={change}
                autoComplete="tel"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold" htmlFor="register-password">
                Mật khẩu
              </label>
              <input
                id="register-password"
                className="form-control form-control-lg"
                type="password"
                minLength="8"
                maxLength="72"
                name="password"
                value={form.password}
                onChange={change}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold" htmlFor="register-confirm">
                Xác nhận mật khẩu
              </label>
              <input
                id="register-confirm"
                className="form-control form-control-lg"
                type="password"
                minLength="8"
                maxLength="72"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={change}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="col-12">
              <button className="btn btn-primary btn-lg w-100" disabled={loading}>
                {loading ? "Đang tạo tài khoản…" : "Đăng ký"}
              </button>
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
