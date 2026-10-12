import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "../../components/course/CourseCard";
import { getCourses } from "../../services/courseService";
import { classroomApi } from "../../services/classroomService";
import { classStatusLabel } from "../../utils/statusLabels";

/** Khóa học của tôi: các lớp đã tham gia (vào học) và các khóa học khác để chọn lớp mới. */
export default function MyCoursesPage() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    Promise.all([classroomApi.studentList(), getCourses()])
      .then(([classData, courseData]) => {
        setClasses(classData);
        setCourses(courseData);
        setState({ loading: false, error: "" });
      })
      .catch((e) =>
        setState({ loading: false, error: e.response?.data?.message || "Không thể tải khóa học" }),
      );
  }, []);

  const others = useMemo(() => {
    const joined = new Set(classes.map((c) => c.courseId));
    const q = query.trim().toLowerCase();
    return courses.filter(
      (course) =>
        !joined.has(course.id) &&
        [course.title, course.description, course.targetScore]
          .filter((v) => v !== null && v !== undefined)
          .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [classes, courses, query]);

  if (state.loading) {
    return (
      <main className="container sc-catalog text-center py-5">
        <div className="spinner-border text-primary" role="status" aria-label="Đang tải" />
      </main>
    );
  }

  return (
    <main className="container sc-catalog">
      <header className="sc-catalog-head">
        <div>
          <h1>Khóa học của tôi</h1>
          <p>Vào học các lớp bạn đã tham gia hoặc chọn thêm khóa học mới.</p>
        </div>
      </header>
      {state.error && <div className="alert alert-danger">{state.error}</div>}

      {classes.length ? (
        <div className="row g-4 mb-5">
          {classes.map((c) => (
            <div className="col-md-6 col-xl-4" key={c.id}>
              <article className="student-class-card">
                <div>
                  <span className={`class-status ${c.status.toLowerCase()}`}>
                    {classStatusLabel(c.status)}
                  </span>
                  <small>{c.classCode}</small>
                </div>
                <h2>{c.courseTitle}</h2>
                <p>Lớp {c.className}</p>
                <div className="student-class-meta">
                  <span>{c.studentCount} học viên</span>
                  <span>{c.lessonCount} bài học</span>
                </div>
                <div className="d-flex gap-2">
                  <Link className="btn btn-primary flex-grow-1" to={`/courses/${c.courseId}`}>
                    Vào học
                  </Link>
                  <Link className="btn btn-outline-primary" to={`/student/classes/${c.id}`}>
                    Lớp học
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      ) : (
        <div className="content-empty mb-5">
          Bạn chưa tham gia lớp nào. Chọn một khóa học bên dưới rồi tham gia lớp để bắt đầu học.
        </div>
      )}

      <header className="sc-catalog-head">
        <div>
          <h2 className="h4 fw-bold mb-0">Khóa học khác</h2>
        </div>
        <input
          className="form-control sc-catalog-search"
          type="search"
          aria-label="Tìm khóa học"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc điểm mục tiêu…"
        />
      </header>
      {others.length ? (
        <ul className="sc-course-grid">
          {others.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="content-empty">
          {query
            ? `Không tìm thấy khóa học phù hợp với “${query}”.`
            : "Không còn khóa học nào khác."}
        </div>
      )}
    </main>
  );
}
