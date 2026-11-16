import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetToken("");
    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
      setResetToken(data.resetToken || "");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể tạo yêu cầu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-5">
        <div className="card auth-card border-0 p-4 p-md-5">
          <h1 className="h3 fw-bold">Quên mật khẩu</h1>
          <p className="text-secondary">Nhập email để nhận mã đặt lại mật khẩu.</p>
          {message && <div className="alert alert-info small">{message}</div>}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <label className="form-label fw-semibold" htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              className="form-control form-control-lg mb-3"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Đang gửi…" : "Gửi yêu cầu"}
            </button>
          </form>
          {resetToken && (
            <div className="alert alert-warning small mt-4">
              <strong>Demo token:</strong>
              <div className="text-break my-2">{resetToken}</div>
              <Link
                className="btn btn-sm btn-dark"
                to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              >
                Đặt mật khẩu mới
              </Link>
            </div>
          )}
          <div className="text-center mt-4">
            <Link to="/login">← Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
