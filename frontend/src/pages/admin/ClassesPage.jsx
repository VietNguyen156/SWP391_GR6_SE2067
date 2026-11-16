import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ClassTable from "../../components/classroom/ClassTable";
import { classroomApi } from "../../services/classroomService";
export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  // Bộ lọc khóa học lưu trên URL (?course=) để quay lại vẫn giữ nguyên.
  const [params, setParams] = useSearchParams();
  const course = params.get("course") || "";
  useEffect(() => {
    classroomApi
      .adminList()
      .then(setClasses)
      .catch((e) => setError(e.response?.data?.message || "Không thể tải lớp học"));
  }, []);
  // Danh sách khóa lấy từ chính các lớp, kèm số lớp mỗi khóa.
  const courses = useMemo(() => {
    const byId = new Map();
    classes.forEach((x) => {
      const item = byId.get(x.courseId) || { id: x.courseId, title: x.courseTitle, count: 0 };
      item.count += 1;
      byId.set(x.courseId, item);
    });
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, "vi"));
  }, [classes]);
  const shown = course ? classes.filter((x) => String(x.courseId) === course) : classes;
  function chooseCourse(value) {
    setParams(value ? { course: value } : {}, { replace: true });
  }
  return (
    <>
      <header className="admin-page-header">
        <h1>Danh sách lớp học</h1>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="admin-filters align-items-center">
        <select
          className="form-select admin-course-filter"
          value={course}
          onChange={(e) => chooseCourse(e.target.value)}
          aria-label="Lọc theo khóa học"
        >
          <option value="">Tất cả khóa học ({classes.length})</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.count})
            </option>
          ))}
        </select>
      </div>
      <ClassTable
        classes={shown}
        admin
        emptyText={course ? "Khóa học này chưa có lớp." : undefined}
      />
    </>
  );
}
