import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReportCard from "../../components/admin/ReportCard";
import { adminApi } from "../../services/adminService";

// Hệ thống chỉ có hai trạng thái: Đang hiển thị và Đã ẩn (mọi trạng thái khác PUBLISHED là Đã ẩn).
const COURSE_STATUS_ROWS = [
  ["VISIBLE", "Đang hiển thị", "bg-success"],
  ["HIDDEN", "Đã ẩn", "bg-secondary"],
];

function fillTone(rate) {
  if (rate >= 100) return "bg-danger";
  if (rate >= 80) return "bg-warning";
  return "bg-success";
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || "Không thể tải dashboard"));
  }, []);
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="spinner-border text-primary" />;

  const raw = data.courseStatusCounts || {};
  const statusCounts = {
    VISIBLE: raw.PUBLISHED || 0,
    HIDDEN: (raw.DRAFT || 0) + (raw.OTHER || 0),
  };
  const maxStatus = Math.max(1, ...COURSE_STATUS_ROWS.map(([key]) => statusCounts[key] || 0));
  const classFills = data.classFills || [];
  const incomplete = data.incompleteCourses || [];

  return (
    <>
      <header className="admin-page-header">
        <h1>Trung tâm quản trị</h1>
      </header>
      <div className="admin-overview-grid">
        <ReportCard label="Tổng người dùng" value={data.totalUsers} />
        <ReportCard label="Học viên" value={data.totalStudents} tone="green" />
        <ReportCard label="Giáo viên" value={data.totalTeachers} tone="purple" />
        <ReportCard label="Khóa học" value={data.totalCourses} tone="orange" />
        <ReportCard label="Test cuối khóa" value={data.totalTests} tone="red" />
        <ReportCard label="Bài học" value={data.totalLessons} tone="cyan" />
        <ReportCard label="Lớp đang hoạt động" value={data.activeClasses} tone="green" />
        <ReportCard
          label="Tỷ lệ lấp đầy lớp"
          value={data.classFillRate == null ? "—" : data.classFillRate}
          unit={data.classFillRate == null ? "" : "%"}
          tone="purple"
        />
        <ReportCard label="Đơn chờ xác nhận" value={data.pendingOrders} tone="red" />
      </div>

      <div className="row g-4 mt-1">
        <section className="col-lg-5">
          <div className="teacher-panel p-4 h-100">
            <h2 className="h5 fw-bold">Khóa học theo trạng thái</h2>
            <p className="text-muted small">Tổng {data.totalCourses} khóa.</p>
            {COURSE_STATUS_ROWS.map(([key, label, tone]) => {
              const count = statusCounts[key] || 0;
              return (
                <div className="mb-3" key={key}>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="progress" role="img" aria-label={`${label}: ${count} khóa`}>
                    <div
                      className={`progress-bar ${tone}`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="col-lg-7">
          <div className="teacher-panel p-4 h-100">
            <h2 className="h5 fw-bold">Mức lấp đầy các lớp đang mở</h2>
            <p className="text-muted small">
              {data.openClassCapacity > 0
                ? `${data.openClassEnrolled}/${data.openClassCapacity} chỗ đã có học viên · ${data.activeClasses}/${data.totalClasses} lớp đang hoạt động.`
                : "Chưa có lớp đang mở nào đặt sĩ số tối đa."}
            </p>
            {classFills.map((room) => (
              <div className="mb-3" key={room.id}>
                <div className="d-flex justify-content-between small mb-1">
                  <span>
                    <strong>{room.className}</strong> · {room.courseTitle}
                  </span>
                  <span>
                    {room.enrolled}/{room.capacity} ({room.fillRate}%)
                  </span>
                </div>
                <div className="progress">
                  <div
                    className={`progress-bar ${fillTone(Number(room.fillRate))}`}
                    style={{ width: `${Math.min(100, Number(room.fillRate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="teacher-panel p-4 mt-4">
        <h2 className="h5 fw-bold">Khóa học chưa hoàn thiện</h2>
        {incomplete.length === 0 ? (
          <p className="text-muted mb-0">Tất cả khóa học đều đã đầy đủ thông tin.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Giáo viên</th>
                  <th>Cần bổ sung</th>
                </tr>
              </thead>
              <tbody>
                {incomplete.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <Link to="/admin/courses">{course.title}</Link>
                    </td>
                    <td>{course.teacherName}</td>
                    <td>
                      {course.issues.map((issue) => (
                        <span className="badge text-bg-warning me-1" key={issue}>
                          {issue}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
