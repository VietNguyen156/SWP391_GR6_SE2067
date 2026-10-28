import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "../../utils/format";
import { Link } from "react-router-dom";
import EmptyArt from "../../components/course/EmptyArt";
import StatusBadge from "../../components/course/StatusBadge";
import { getTeacherCourses } from "../../services/courseService";

export default function CourseManagementPage() {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    getTeacherCourses()
      .then((data) => {
        setCourses(data);
        setState({ loading: false, error: "" });
      })
      .catch((e) =>
        setState({ loading: false, error: e.response?.data?.message || "Không thể tải khóa học" }),
      );
  }, []);

  const filtered = useMemo(
    () => courses.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase())),
    [courses, query],
  );

  return (
    <main className="container cs-page">
      <header className="cs-head">
        <div className="cs-head-main">
          <h1 className="cs-title">Khóa học của tôi</h1>
          {!state.loading && <p className="cs-meta">{courses.length} khóa học</p>}
        </div>
        <div className="cs-head-actions">
          {courses.length > 6 && (
            <input
              className="form-control cs-search"
              type="search"
              aria-label="Tìm khóa học"
              placeholder="Tìm khóa học…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <Link className="btn btn-primary" to="/teacher/courses/new">
            + Tạo khóa học
          </Link>
        </div>
      </header>

      {state.error && (
        <div className="alert alert-danger cs-alert" role="alert">
          {state.error}
        </div>
      )}

      {state.loading ? (
        <div className="cs-loading">
          <div className="spinner-border text-primary" role="status" aria-label="Đang tải" />
        </div>
      ) : filtered.length ? (
        <ul className="cs-course-grid">
          {filtered.map((course) => (
            <li key={course.id}>
              <Link className="cs-card cs-course-card" to={`/teacher/courses/${course.id}`}>
                <span className="cs-cover">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="cs-cover-initial" aria-hidden="true">
                      {course.title.trim().charAt(0).toUpperCase() || "K"}
                    </span>
                  )}
                </span>
                <span className="cs-course-body">
                  <span className="cs-course-title">{course.title}</span>
                  <span className="cs-course-foot">
                    <span className="cs-muted">
                      {course.weekCount || 0} tuần · {course.lessonCount || 0} bài ·{" "}
                      {formatMoney(course.price, { freeLabel: "Miễn phí" })}
                    </span>
                    <StatusBadge status={course.status} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="cs-card cs-empty">
          <EmptyArt />
          <p>{courses.length ? "Không tìm thấy khóa học." : "Bạn chưa có khóa học nào."}</p>
        </div>
      )}
    </main>
  );
}
