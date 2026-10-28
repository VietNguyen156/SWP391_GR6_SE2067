import { statusLabel } from "../../utils/statusLabels";
import { useSuccessToast } from "../../components/common/Toast";
import { useEffect, useState } from "react";
import { getMe } from "../../services/authService";
import { profileToForm } from "../../utils/editForms";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfilePage() {
  const { user, saveProfile, updatePassword } = useAuth();
  const [profile, setProfile] = useState({ fullName: "", phone: "", avatarUrl: "" });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileState, setProfileState] = useState({ loading: false, message: "", error: "" });
  useSuccessToast(profileState.message);
  const [passwordState, setPasswordState] = useState({ loading: false, error: "" });
  const navigate = useNavigate();

  // Hồ sơ lấy từ /auth/me (không dựa vào bản lưu lúc đăng nhập có thể đã cũ); nạp một lần.
  useEffect(() => {
    if (user) setProfile(profileToForm(user));
    getMe()
      .then((me) => setProfile(profileToForm(me)))
      .catch(() => {});
  }, []);

  async function submitProfile(event) {
    event.preventDefault();
    setProfileState({ loading: true, message: "", error: "" });
    try {
      await saveProfile(profile);
      setProfileState({ loading: false, message: "Cập nhật hồ sơ thành công", error: "" });
    } catch (requestError) {
      setProfileState({
        loading: false,
        message: "",
        error: requestError.response?.data?.message || "Không thể cập nhật hồ sơ",
      });
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordState({ loading: false, error: "" });
    if (password.newPassword !== password.confirmPassword) {
      setPasswordState({ loading: false, error: "Mật khẩu xác nhận không khớp" });
      return;
    }
    setPasswordState({ loading: true, error: "" });
    try {
      const response = await updatePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      navigate("/login", { replace: true, state: { message: response.message } });
    } catch (requestError) {
      setPasswordState({
        loading: false,
        error: requestError.response?.data?.message || "Không thể đổi mật khẩu",
      });
    }
  }

  return (
    <main className="container py-5 profile-shell">
      <div className="profile-hero mb-4">
        <div className="profile-avatar-large">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Ảnh đại diện" />
          ) : (
            user?.fullName?.charAt(0)?.toUpperCase() || "U"
          )}
        </div>
        <div>
          <p>TÀI KHOẢN {user?.role}</p>
          <h1>Hồ sơ cá nhân</h1>
          <span>{user?.email}</span>
        </div>
        <span className="profile-status">
          <i />
          {statusLabel(user?.status)}
        </span>
      </div>
      <div className="row g-4">
        <div className="col-lg-7">
          <section className="card profile-card border-0 p-4">
            <h2 className="h5 fw-bold mb-4">Thông tin cơ bản</h2>
            {profileState.error && (
              <div className="alert alert-danger" role="alert">
                {profileState.error}
              </div>
            )}
            <form onSubmit={submitProfile} className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="profile-email">
                  Email
                </label>
                <input
                  id="profile-email"
                  className="form-control"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <div className="col-md-7">
                <label className="form-label fw-semibold" htmlFor="profile-name">
                  Họ và tên
                </label>
                <input
                  id="profile-name"
                  className="form-control"
                  maxLength="150"
                  value={profile.fullName}
                  onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                  required
                />
              </div>
              <div className="col-md-5">
                <label className="form-label fw-semibold" htmlFor="profile-phone">
                  Số điện thoại
                </label>
                <input
                  id="profile-phone"
                  className="form-control"
                  maxLength="30"
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="profile-avatar">
                  URL ảnh đại diện
                </label>
                <input
                  id="profile-avatar"
                  className="form-control"
                  type="url"
                  maxLength="500"
                  value={profile.avatarUrl}
                  onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-primary" disabled={profileState.loading}>
                  {profileState.loading ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </section>
        </div>
        <div className="col-lg-5">
          <section className="card profile-card border-0 p-4">
            <h2 className="h5 fw-bold mb-4">Đổi mật khẩu</h2>
            {passwordState.error && (
              <div className="alert alert-danger" role="alert">
                {passwordState.error}
              </div>
            )}
            <form onSubmit={submitPassword}>
              <label className="form-label fw-semibold" htmlFor="current-password">
                Mật khẩu hiện tại
              </label>
              <input
                id="current-password"
                className="form-control mb-3"
                type="password"
                value={password.currentPassword}
                onChange={(event) =>
                  setPassword({ ...password, currentPassword: event.target.value })
                }
                required
                autoComplete="current-password"
              />
              <label className="form-label fw-semibold" htmlFor="new-password">
                Mật khẩu mới
              </label>
              <input
                id="new-password"
                className="form-control mb-3"
                type="password"
                minLength="8"
                maxLength="72"
                value={password.newPassword}
                onChange={(event) => setPassword({ ...password, newPassword: event.target.value })}
                required
                autoComplete="new-password"
              />
              <label className="form-label fw-semibold" htmlFor="confirm-password">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirm-password"
                className="form-control mb-4"
                type="password"
                minLength="8"
                maxLength="72"
                value={password.confirmPassword}
                onChange={(event) =>
                  setPassword({ ...password, confirmPassword: event.target.value })
                }
                required
                autoComplete="new-password"
              />
              <button className="btn btn-outline-dark w-100" disabled={passwordState.loading}>
                {passwordState.loading ? "Đang cập nhật…" : "Đổi mật khẩu"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
