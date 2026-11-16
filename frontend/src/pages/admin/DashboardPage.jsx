import { useEffect, useState } from "react";
import ReportCard from "../../components/admin/ReportCard";
import { adminApi } from "../../services/adminService";
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
  return (
    <>
      <header className="admin-page-header">
        <h1>Trung tâm quản trị</h1>
        <p>Tổng quan dữ liệu đang vận hành trên TOEIC Path.</p>
      </header>
      <div className="admin-overview-grid">
        <ReportCard label="Tổng người dùng" value={data.totalUsers} />
        <ReportCard label="Học viên" value={data.totalStudents} tone="green" />
        <ReportCard label="Giáo viên" value={data.totalTeachers} tone="purple" />
        <ReportCard label="Khóa học" value={data.totalCourses} tone="orange" />
        <ReportCard label="Quiz" value={data.totalQuizzes} tone="red" />
        <ReportCard label="Bài học" value={data.totalLessons} tone="cyan" />
      </div>
    </>
  );
}
