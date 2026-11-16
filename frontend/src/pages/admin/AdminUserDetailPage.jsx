import { useEffect, useState } from "react";
import { formatDateTime } from "../../utils/format";
import { useSuccessToast } from "../../components/common/Toast";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../../services/adminService";
import {
  USER_STATUS_OPTIONS,
  roleLabel,
  statusLabel,
  userStatusValue,
} from "../../utils/statusLabels";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [state, setState] = useState({ loading: true, saving: false, error: "", message: "" });
  useSuccessToast(state.message);

  useEffect(() => {
    let active = true;
    setState({ loading: true, saving: false, error: "", message: "" });
    adminApi
      .user(id)
      .then((data) => {
        if (!active) return;
        setUser(data);
        setState((current) => ({ ...current, loading: false }));
      })
      .catch((e) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: e.response?.data?.message || "Không thể tải chi tiết người dùng",
        }));
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function updateStatus(status) {
    setState((current) => ({ ...current, saving: true, error: "", message: "" }));
    try {
      const updated = await adminApi.updateUserStatus(id, status);
      setUser(updated);
      setState((current) => ({
        ...current,
        saving: false,
        message: "Đã cập nhật trạng thái người dùng.",
      }));
    } catch (e) {
      setState((current) => ({
        ...current,
        saving: false,
        error: e.response?.data?.message || "Không thể cập nhật trạng thái",
      }));
    }
  }

  if (state.loading) return <div className="spinner-border text-primary" />;
  if (!user) {
    return (
      <>
        <div className="alert alert-danger">{state.error || "Không tìm thấy người dùng"}</div>
        <Link to="/admin/users">← Quay lại danh sách</Link>
      </>
    );
  }

  return (
    <>
      <header className="admin-page-header">
        <Link className="course-back-link" to="/admin/users">
          ← Danh sách người dùng
        </Link>
        <span className="d-block mt-3">USER #{user.id}</span>
        <h1>{user.fullName}</h1>
      </header>

      {state.error && <div className="alert alert-danger">{state.error}</div>}

      <section className="teacher-panel p-4">
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label text-secondary">Email</label>
            <div className="fw-semibold">{user.email}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-secondary">Điện thoại</label>
            <div className="fw-semibold">{user.phone || "—"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-secondary">Vai trò</label>
            <div>
              <span className={`admin-role ${String(user.role).toLowerCase()}`}>
                {roleLabel(user.role)}
              </span>
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-secondary">Trạng thái hiện tại</label>
            <div className="fw-semibold">{statusLabel(user.status)}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-secondary">Ngày tạo</label>
            <div className="fw-semibold">{formatDateTime(user.createdAt, "—")}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-secondary">Đăng nhập cuối</label>
            <div className="fw-semibold">{formatDateTime(user.lastLoginAt, "—")}</div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Đổi trạng thái</label>
            <select
              className="form-select"
              value={userStatusValue(user.status)}
              disabled={state.saving}
              onChange={(e) => updateStatus(e.target.value)}
            >
              {USER_STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </>
  );
}
