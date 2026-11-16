import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword, verifyResetCode } from "../../services/authService";

const RESEND_SECONDS = 60;

/** Số giây còn lại của lần gửi mã gần nhất (giữ đúng cả khi tải lại trang nhờ router state). */
function remainingSeconds(sentAt) {
  if (!sentAt) return 0;
  return Math.max(0, RESEND_SECONDS - Math.floor((Date.now() - sentAt) / 1000));
}

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [info, setInfo] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  // Chỉ khi mã được máy chủ xác nhận đúng mới hiện ô mật khẩu mới.
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(() => remainingSeconds(location.state?.sentAt));

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  // Mã chỉ gồm chữ số, tối đa 6 ký tự.
  const changeCode = (event) =>
    setForm({ ...form, code: event.target.value.replace(/\D/g, "").slice(0, 6) });

  async function resend() {
    if (!form.email.trim()) {
      setError("Nhập email để nhận mã mới");
      return;
    }
    setResending(true);
    setError("");
    setInfo("");
    try {
      const data = await forgotPassword(form.email.trim());
      setInfo(data.message);
      setVerified(false);
      setCooldown(RESEND_SECONDS);
    } catch (requestError) {
      const body = requestError.response?.data;
      setError(body?.message || "Không thể gửi lại mã");
      if (requestError.response?.status === 429 && body?.retryAfterSeconds) {
        setCooldown(body.retryAfterSeconds);
      }
    } finally {
      setResending(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(form.code)) {
      setError("Mã xác nhận gồm đúng 6 chữ số");
      return;
    }
    if (!verified) {
      setLoading(true);
      try {
        await verifyResetCode({ email: form.email.trim(), code: form.code });
        setVerified(true);
        setInfo("Mã hợp lệ. Hãy nhập mật khẩu mới.");
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Không thể xác nhận mã");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email: form.email.trim(),
        code: form.code,
        newPassword: form.newPassword,
      });
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
          {info && <div className="alert alert-info small">{info}</div>}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <label className="form-label fw-semibold" htmlFor="reset-email">
              Email
            </label>
            <input
              id="reset-email"
              className="form-control mb-3"
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              readOnly={verified}
              required
              autoComplete="email"
            />
            <label className="form-label fw-semibold" htmlFor="reset-code">
              Mã xác nhận
            </label>
            <input
              id="reset-code"
              className="form-control mb-1 text-center fs-4"
              style={{ letterSpacing: "0.4em" }}
              name="code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="······"
              value={form.code}
              onChange={changeCode}
              readOnly={verified}
              required
              autoComplete="one-time-code"
            />
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small text-secondary">Mã có hiệu lực 10 phút.</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0"
                onClick={resend}
                disabled={cooldown > 0 || resending}
              >
                {resending
                  ? "Đang gửi…"
                  : cooldown > 0
                    ? `Gửi lại mã sau ${cooldown}s`
                    : "Gửi lại mã"}
              </button>
            </div>
            {verified && (
              <>
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
              </>
            )}
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Đang xử lý…" : verified ? "Đặt lại mật khẩu" : "Xác nhận mã"}
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
