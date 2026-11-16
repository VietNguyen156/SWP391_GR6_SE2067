import { classStatusLabel } from "../../utils/statusLabels";
import IconButton from "../common/IconButton";
export default function ClassTable({
  classes,
  onEdit,
  onDelete,
  admin = false,
  emptyText = "Chưa có lớp học.",
}) {
  return (
    <div className="table-responsive class-table">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Lớp học</th>
            <th>Khóa học</th>
            <th>Lịch</th>
            <th>Học viên</th>
            <th>Trạng thái</th>
            {!admin && <th />}
          </tr>
        </thead>
        <tbody>
          {classes.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.className}</strong>
                <small>{item.classCode}</small>
              </td>
              <td>{item.courseTitle}</td>
              <td>
                <small>{item.startDate || "—"}</small>
                <small>{item.endDate || "—"}</small>
              </td>
              <td>
                {item.studentCount}
                {item.maxStudents ? ` / ${item.maxStudents}` : ""}
              </td>
              <td>
                <span className={`class-status ${item.status.toLowerCase()}`}>
                  {classStatusLabel(item.status)}
                </span>
              </td>
              {!admin && (
                <td>
                  <div className="d-flex gap-1 justify-content-end">
                    <IconButton icon="eye" label="Chi tiết" to={`/teacher/classes/${item.id}`} />
                    <IconButton icon="edit" label="Sửa" onClick={() => onEdit(item)} />
                    <IconButton
                      icon="trash"
                      label="Xóa lớp"
                      tone="danger"
                      onClick={() => onDelete(item)}
                      disabled={Number(item.studentCount) > 0}
                      disabledReason="Lớp đã có học viên. Hãy chuyển trạng thái lớp sang Đã đóng."
                    />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!classes.length && <div className="content-empty m-3">{emptyText}</div>}
    </div>
  );
}
