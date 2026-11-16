import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    token: searchParams.get("token") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(form.token, form.newPassword);
      navigate("/login", {
        replace: true,
        state: { message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập." },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-5">
        <div className="card auth-card border-0 p-4 p-md-5">
          <h1 className="h3 fw-bold">Đặt lại mật khẩu</h1>
          <p className="text-secondary">Mã đặt lại có hiệu lực trong 15 phút.</p>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <label className="form-label fw-semibold" htmlFor="reset-token">
              Mã đặt lại
            </label>
            <input
              id="reset-token"
              className="form-control mb-3"
              name="token"
              value={form.token}
              onChange={change}
              required
            />
            <label className="form-label fw-semibold" htmlFor="reset-password">
              Mật khẩu mới
            </label>
            <input
              id="reset-password"
              className="form-control mb-3"
              name="newPassword"
              type="password"
              minLength="8"
              maxLength="72"
              value={form.newPassword}
              onChange={change}
              required
              autoComplete="new-password"
            />
            <label className="form-label fw-semibold" htmlFor="reset-confirm">
              Xác nhận mật khẩu
            </label>
            <input
              id="reset-confirm"
              className="form-control mb-4"
              name="confirmPassword"
              type="password"
              minLength="8"
              maxLength="72"
              value={form.confirmPassword}
              onChange={change}
              required
              autoComplete="new-password"
            />
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Đang cập nhật…" : "Đặt lại mật khẩu"}
            </button>
          </form>
          <div className="text-center mt-4">
            <Link to="/login">← Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
