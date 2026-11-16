import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserTable from "../../components/admin/UserTable";
import { adminApi } from "../../services/adminService";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [state, setState] = useState({ loading: true, busyId: null, error: "" });

  async function load() {
    try {
      setUsers(await adminApi.users());
      setState((current) => ({ ...current, loading: false, error: "" }));
    } catch (e) {
      setState((current) => ({
        ...current,
        loading: false,
        error: e.response?.data?.message || "Không thể tải người dùng",
      }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          (!role || user.role === role) &&
          `${user.fullName} ${user.email}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search, role],
  );

  async function updateStatus(id, status) {
    setState((current) => ({ ...current, busyId: id, error: "" }));
    try {
      const updated = await adminApi.updateUserStatus(id, status);
      setUsers((items) => items.map((item) => (item.id === id ? updated : item)));
    } catch (e) {
      setState((current) => ({
        ...current,
        error: e.response?.data?.message || "Không thể cập nhật trạng thái",
      }));
    } finally {
      setState((current) => ({ ...current, busyId: null }));
    }
  }

  return (
    <>
      <header className="admin-page-header">
        <h1>Người dùng</h1>
        <p>Khóa, mở khóa và xem chi tiết tài khoản.</p>
      </header>
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <div className="admin-filters">
        <input
          className="form-control"
          placeholder="Tìm tên hoặc email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="STUDENT">Học viên</option>
          <option value="TEACHER">Giáo viên</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
      </div>
      {state.loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <UserTable
          users={filtered}
          onStatus={updateStatus}
          onView={(userId) => navigate(`/admin/users/${userId}`)}
          busyId={state.busyId}
        />
      )}
    </>
  );
}
