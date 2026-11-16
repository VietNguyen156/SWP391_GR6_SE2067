import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon";
import { getTeacherCourses, getTeacherCurriculum } from "../../services/courseService";
import { teacherLessonLink, teacherWeekLink } from "../../utils/lessonMaterials";

const links = [
  ["/teacher/dashboard", "Dashboard", "dashboard"],
  ["/teacher/courses", "Khóa học", "book"],
  ["/teacher/classes", "Lớp học", "users"],
  ["/teacher/questions", "Ngân hàng đề thi", "question"],
  ["/teacher/library", "Thư viện học liệu", "cards"],
];

// Trang tuần và trang bài học thuộc mục Khóa học (bài học nằm ở /teacher/lessons).
const alsoActive = { "/teacher/courses": ["/teacher/lessons"] };

const MATERIAL_PATH = /^\/teacher\/(grammar|flashcards|listening|reading|speaking)(\/|$)/;

/** Mục lục Khóa học → Tuần → Bài, bung ngay dưới mục "Khóa học" của menu. */
function CourseTree({ pathname, search }) {
  const [tree, setTree] = useState(null);
  const [open, setOpen] = useState(() => new Set());

  // Tải lại khi giáo viên vừa thêm, sửa, xóa khóa/tuần/bài (sự kiện từ axiosClient).
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let timer;
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setReloadKey((k) => k + 1), 400);
    };
    window.addEventListener("teacher:changed", onChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("teacher:changed", onChange);
    };
  }, []);
  useEffect(() => {
    let off = false;
    getTeacherCourses()
      .then((courses) =>
        Promise.all(courses.map((c) => getTeacherCurriculum(c.id).catch(() => []))).then(
          (curricula) => courses.map((course, i) => ({ course, weeks: curricula[i] || [] })),
        ),
      )
      .then((data) => !off && setTree(data))
      .catch(() => !off && setTree([]));
    return () => {
      off = true;
    };
  }, [reloadKey]);

  const here = useMemo(() => {
    const id = (re) => pathname.match(re)?.[1] ?? null;
    const params = new URLSearchParams(search);
    const lessonId = id(/^\/teacher\/lessons\/(\d+)/) ?? params.get("lessonId");
    let courseId = id(/^\/teacher\/courses\/(\d+)/);
    let weekId = id(/\/weeks\/(\d+)/);
    for (const { course, weeks } of tree || []) {
      for (const week of weeks) {
        const hasLesson = (week.lessons || []).some((l) => String(l.id) === String(lessonId));
        if (hasLesson || String(week.id) === String(weekId)) {
          courseId = course.id;
          weekId = week.id;
        }
      }
    }
    return { courseId: courseId && String(courseId), weekId: weekId && String(weekId), lessonId };
  }, [tree, pathname, search]);

  // Tự mở khóa và tuần đang xem.
  useEffect(() => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (here.courseId) next.add(`c${here.courseId}`);
      if (here.weekId) next.add(`w${here.weekId}`);
      return next;
    });
  }, [here.courseId, here.weekId]);

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (!tree) return <p className="tt-note">Đang tải…</p>;
  if (!tree.length) return <p className="tt-note">Chưa có khóa học.</p>;

  return (
    <ul className="tt" aria-label="Mục lục khóa học">
      {tree.map(({ course, weeks }) => {
        const cKey = `c${course.id}`;
        const cOpen = open.has(cKey);
        return (
          <li key={course.id}>
            <div className={`tt-row tt-course ${String(course.id) === here.courseId ? "is-here" : ""}`}>
              <button
                type="button"
                className="tt-chevron"
                aria-expanded={cOpen}
                aria-label={`${cOpen ? "Thu gọn" : "Mở"} ${course.title}`}
                onClick={() => toggle(cKey)}
              >
                {cOpen ? "▾" : "▸"}
              </button>
              <Link to={`/teacher/courses/${course.id}`} title={course.title}>
                <span className="tt-badge tt-badge-course">KH</span>
                <span className="tt-text">{course.title}</span>
              </Link>
            </div>
            {cOpen && (
              <ul className="tt-weeks">
                {weeks.map((week) => {
                  const wKey = `w${week.id}`;
                  const wOpen = open.has(wKey);
                  const lessons = week.lessons || [];
                  return (
                    <li key={week.id}>
                      <div
                        className={`tt-row ${String(week.id) === here.weekId && !here.lessonId ? "is-current" : ""}`}
                      >
                        <button
                          type="button"
                          className="tt-chevron"
                          aria-expanded={wOpen}
                          aria-label={`${wOpen ? "Thu gọn" : "Mở"} tuần ${week.weekNumber}`}
                          onClick={() => toggle(wKey)}
                          disabled={!lessons.length}
                        >
                          {lessons.length ? (wOpen ? "▾" : "▸") : ""}
                        </button>
                        <Link to={teacherWeekLink(course.id, week.id)} title={week.title}>
                          <span className="tt-badge tt-badge-week">T{week.weekNumber}</span>
                          <span className="tt-text">{week.title}</span>
                        </Link>
                      </div>
                      {wOpen && lessons.length > 0 && (
                        <ul className="tt-lessons">
                          {lessons.map((lesson, i) => (
                            <li key={lesson.id}>
                              <Link
                                to={teacherLessonLink(lesson.id)}
                                title={lesson.title}
                                className={String(lesson.id) === String(here.lessonId) ? "is-current" : ""}
                              >
                                <span className="tt-badge tt-badge-lesson">B{i + 1}</span>
                                <span className="tt-text">{lesson.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
                {!weeks.length && <li className="tt-note">Chưa có tuần nào.</li>}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function TeacherSidebar() {
  const { pathname, search } = useLocation();
  // Trang học liệu thuộc mục mà giáo viên đi vào: từ bài học → Khóa học, còn lại → Thư viện học liệu.
  const materialOwner = MATERIAL_PATH.test(pathname)
    ? new URLSearchParams(search).get("from") === "lesson"
      ? "/teacher/courses"
      : "/teacher/library"
    : null;
  const inCourses =
    pathname.startsWith("/teacher/courses") ||
    pathname.startsWith("/teacher/lessons") ||
    materialOwner === "/teacher/courses";
  const [treeOpen, setTreeOpen] = useState(inCourses);
  useEffect(() => {
    if (inCourses) setTreeOpen(true);
  }, [inCourses]);

  return (
    <aside className="teacher-sidebar" aria-label="Điều hướng giáo viên">
      <div className="teacher-sidebar-brand">
        <strong>Trung tâm giảng dạy</strong>
      </div>
      <nav>
        <section>
          {links.map(([to, label, icon]) => (
            <div key={to} className={to === "/teacher/courses" ? "tt-group" : undefined}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  isActive ||
                  materialOwner === to ||
                  (alsoActive[to] || []).some((path) => pathname.startsWith(`${path}/`))
                    ? "active"
                    : ""
                }
              >
                <Icon name={icon} size={18} />
                <span>{label}</span>
              </NavLink>
              {to === "/teacher/courses" && (
                <button
                  type="button"
                  className="tt-toggle"
                  aria-expanded={treeOpen}
                  aria-label={treeOpen ? "Thu gọn mục lục khóa học" : "Mở mục lục khóa học"}
                  onClick={() => setTreeOpen((v) => !v)}
                >
                  {treeOpen ? "▾" : "▸"}
                </button>
              )}
              {to === "/teacher/courses" && treeOpen && (
                <CourseTree pathname={pathname} search={search} />
              )}
            </div>
          ))}
        </section>
      </nav>
    </aside>
  );
}
