import { USER_STATUS_OPTIONS, roleLabel, userStatusValue } from "../../utils/statusLabels";
import { formatDate } from "../../utils/format";
export default function UserTable({ users, onStatus, onView, busyId }) {
  return (
    <div className="table-responsive admin-table-wrap">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.fullName}</strong>
                <small>{user.email}</small>
              </td>
              <td>
                <span className={`admin-role ${user.role.toLowerCase()}`}>
                  {roleLabel(user.role)}
                </span>
              </td>
              <td>
                <select
                  className="form-select form-select-sm"
                  value={userStatusValue(user.status)}
                  disabled={busyId === user.id}
                  onChange={(e) => onStatus(user.id, e.target.value)}
                >
                  {USER_STATUS_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => onView(user.id)}
                >
                  Chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!users.length && <div className="content-empty m-3">Không tìm thấy người dùng.</div>}
    </div>
  );
}
