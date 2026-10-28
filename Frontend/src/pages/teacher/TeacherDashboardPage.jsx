import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { formatPercent, formatNumber } from "../../utils/format";
import { Link } from "react-router-dom";
import StatisticCard from "../../components/progress/StatisticCard";
import { progressApi } from "../../services/progressService";
export default function TeacherDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    progressApi
      .teacherDashboard()
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || "Không thể tải dashboard giáo viên"));
  }, []);
  if (error)
    return (
      <main className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  if (!data) return <LoadingState />;
  return (
    <main className="container py-5 dashboard-shell">
      <header className="teacher-page-head teacher-dashboard-head">
        <div>
          <h1>Hiệu quả giảng dạy</h1>
        </div>
        <div className="teacher-page-head-actions">
          <Link className="btn btn-outline-primary" to="/teacher/classes">
            Lớp học
          </Link>
          <Link className="btn btn-primary" to="/teacher/courses">
            Quản lý khóa học
          </Link>
        </div>
      </header>
      <div className="dashboard-stat-grid">
        <StatisticCard label="Khóa học" value={data.totalCourses} />
        <StatisticCard label="Lớp học" value={data.totalClasses} tone="blue" />
        <StatisticCard label="Học viên" value={data.totalStudents} tone="green" />
        <StatisticCard
          label="Hoàn thành lớp"
          value={formatNumber(data.classCompletionRate)}
          unit="%"
          tone="purple"
        />
        <StatisticCard
          label="Điểm Test"
          value={formatNumber(data.averageTestScore)}
          unit="%"
          tone="orange"
        />
      </div>
      <section className="teacher-performance-table">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th>Lớp</th>
                <th>Học viên</th>
                <th>Hoàn thành</th>
                <th>Điểm Test</th>
                <th>Bài đã hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.map((course) => (
                <tr key={course.courseId}>
                  <td>
                    <strong>{course.courseTitle}</strong>
                  </td>
                  <td>{course.classCount}</td>
                  <td>{course.studentCount}</td>
                  <td>
                    <div className="mini-progress">
                      <div
                        style={{ width: `${Math.min(100, Number(course.classCompletionRate))}%` }}
                      />
                    </div>
                    <small>{formatPercent(course.classCompletionRate)}</small>
                  </td>
                  <td>{formatPercent(course.averageTestScore)}</td>
                  <td>{course.completedLessons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.courses.length && <div className="content-empty">Chưa có khóa học để thống kê.</div>}
      </section>
    </main>
  );
}
