import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await forgotPassword(email.trim());
      // Email và thời điểm gửi đi theo router state (không đưa mã hay mật khẩu lên URL).
      navigate("/reset-password", {
        state: { email: email.trim(), message: data.message, sentAt: Date.now() },
      });
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
              {loading ? "Đang gửi…" : "Gửi mã xác nhận"}
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
