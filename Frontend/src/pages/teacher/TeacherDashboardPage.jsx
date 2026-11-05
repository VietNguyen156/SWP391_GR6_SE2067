import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { formatPercent, formatNumber } from "../../utils/format";
import { Link } from "react-router-dom";
import StatisticCard from "../../components/progress/StatisticCard";
import { progressApi } from "../../services/progressService";
import { classroomApi } from "../../services/classroomService";

export default function TeacherDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([progressApi.teacherDashboard(), classroomApi.teacherList()])
      .then(([dashboard, classes]) => setData({ ...dashboard, classes }))
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
          <p>Tổng quan hoạt động học tập và kết quả các khóa học của bạn.</p>
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

      <div className="dashboard-stat-grid teacher-dashboard-stat-grid">
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

      <TeacherDashboardAnalytics courses={data.courses} classes={data.classes} />

      <section className="teacher-performance-table">
        <div className="teacher-dashboard-table-head">
          <div>
            <h2>Chi tiết theo khóa học</h2>
            <p>Số liệu tổng hợp của các lớp thuộc từng khóa học.</p>
          </div>
          <Link to="/teacher/courses">Quản lý khóa học</Link>
        </div>
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
                    <Link
                      className="teacher-dashboard-course-title"
                      to={`/teacher/courses/${course.courseId}`}
                    >
                      {course.courseTitle}
                    </Link>
                  </td>
                  <td>{course.classCount}</td>
                  <td>{course.studentCount}</td>
                  <td>
                    <div className="mini-progress">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, Number(course.classCompletionRate) || 0))}%`,
                        }}
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

function TeacherDashboardAnalytics({ courses, classes }) {
  const chartCourses = courses.slice(0, 8);
  const rankedCourses = [...courses]
    .sort((a, b) => Number(b.averageTestScore || 0) - Number(a.averageTestScore || 0))
    .slice(0, 6);
  const openClasses = classes.filter((classroom) => classroom.status === "OPEN").length;
  const closedClasses = classes.length - openClasses;
  const openPercentage = classes.length ? (openClasses / classes.length) * 100 : 0;
  const donutStyle = {
    "--open-share": `${openPercentage}%`,
  };
  return (
    <section className="teacher-dashboard-analytics" aria-label="Phân tích hoạt động giảng dạy">
      <article className="teacher-dashboard-chart-card">
        <div className="teacher-dashboard-widget-head">
          <div>
            <span>SO SÁNH THEO KHÓA</span>
            <h2>Tiến độ và điểm Test</h2>
          </div>
          <div className="teacher-dashboard-chart-legend">
            <span>
              <i className="progress" /> Hoàn thành
            </span>
            <span>
              <i className="score" /> Điểm Test
            </span>
          </div>
        </div>
        {chartCourses.length ? (
          <div className="teacher-dashboard-bar-chart">
            <div className="teacher-dashboard-chart-axis" aria-hidden="true">
              {[100, 75, 50, 25, 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className="teacher-dashboard-chart-plot">
              {chartCourses.map((course) => {
                const progress = Math.min(
                  100,
                  Math.max(0, Number(course.classCompletionRate) || 0),
                );
                const score = Math.min(100, Math.max(0, Number(course.averageTestScore) || 0));
                return (
                  <div className="teacher-dashboard-chart-group" key={course.courseId}>
                    <div className="teacher-dashboard-chart-bars">
                      <span
                        className="progress"
                        style={{ height: `${progress}%` }}
                        title={`Hoàn thành ${formatPercent(course.classCompletionRate)}`}
                      />
                      <span
                        className="score"
                        style={{ height: `${score}%` }}
                        title={`Điểm Test ${formatPercent(course.averageTestScore)}`}
                      />
                    </div>
                    <Link to={`/teacher/courses/${course.courseId}`} title={course.courseTitle}>
                      {course.courseTitle}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="teacher-dashboard-widget-empty">Chưa có khóa học để hiển thị biểu đồ.</p>
        )}
      </article>

      <article className="teacher-dashboard-ranking-card">
        <div className="teacher-dashboard-widget-head">
          <div>
            <span>XẾP HẠNG</span>
            <h2>Điểm Test theo khóa</h2>
          </div>
          <span className="teacher-dashboard-sort-label">Cao nhất</span>
        </div>
        {rankedCourses.length ? (
          <ol className="teacher-dashboard-ranking-list">
            {rankedCourses.map((course, index) => (
              <li key={course.courseId}>
                <span className="teacher-dashboard-rank-number">{index + 1}</span>
                <Link
                  to={`/teacher/courses/${course.courseId}`}
                  title={course.courseTitle}
                  className="teacher-dashboard-rank-name"
                >
                  {course.courseTitle}
                </Link>
                <strong>{formatPercent(course.averageTestScore)}</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p className="teacher-dashboard-widget-empty">Chưa có điểm Test để xếp hạng.</p>
        )}
      </article>

      <article className="teacher-dashboard-class-mix-card">
        <div className="teacher-dashboard-widget-head">
          <div>
            <span>TRẠNG THÁI LỚP</span>
            <h2>Phân bổ lớp học</h2>
          </div>
        </div>
        {classes.length ? (
          <>
            <div
              className="teacher-dashboard-donut"
              style={donutStyle}
              role="img"
              aria-label={`${openClasses} lớp đang mở, ${closedClasses} lớp đã đóng`}
            >
              <div>
                <strong>{classes.length}</strong>
                <span>Tổng lớp</span>
              </div>
            </div>
            <ul className="teacher-dashboard-donut-legend">
              <li>
                <span>
                  <i className="open" />
                  Lớp đang mở
                </span>
                <strong>{openClasses}</strong>
              </li>
              <li>
                <span>
                  <i className="closed" />
                  Lớp đã đóng
                </span>
                <strong>{closedClasses}</strong>
              </li>
            </ul>
          </>
        ) : (
          <p className="teacher-dashboard-widget-empty">Chưa có lớp để thống kê.</p>
        )}
      </article>
    </section>
  );
}
