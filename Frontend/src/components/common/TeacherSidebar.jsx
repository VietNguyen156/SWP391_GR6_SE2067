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

function CourseTree({ pathname, search }) {
  const [tree, setTree] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(() => new Set());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let timer;
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setReloadKey((key) => key + 1), 400);
    };
    window.addEventListener("teacher:changed", onChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("teacher:changed", onChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTree(null);
    setLoadError("");
    getTeacherCourses()
      .then((courses) =>
        Promise.all(courses.map((course) => getTeacherCurriculum(course.id))).then(
          (curricula) => courses.map((course, index) => ({ course, weeks: curricula[index] || [] })),
        ),
      )
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch(() => {
        if (!cancelled) {
          setTree([]);
          setLoadError("Không thể tải mục lục khóa học.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const here = useMemo(() => {
    const id = (pattern) => pathname.match(pattern)?.[1] ?? null;
    const params = new URLSearchParams(search);
    const lessonId = id(/^\/teacher\/lessons\/(\d+)/) ?? params.get("lessonId");
    let courseId = id(/^\/teacher\/courses\/(\d+)/);
    let weekId = id(/\/weeks\/(\d+)/);
    for (const { course, weeks } of tree || []) {
      for (const week of weeks) {
        const hasLesson = (week.lessons || []).some(
          (lesson) => String(lesson.id) === String(lessonId),
        );
        if (hasLesson || String(week.id) === String(weekId)) {
          courseId = course.id;
          weekId = week.id;
        }
      }
    }
    return {
      courseId: courseId && String(courseId),
      weekId: weekId && String(weekId),
      lessonId,
    };
  }, [tree, pathname, search]);

  useEffect(() => {
    setOpen((previous) => {
      const next = new Set(previous);
      if (here.courseId) next.add(`c${here.courseId}`);
      if (here.weekId) next.add(`w${here.weekId}`);
      return next;
    });
  }, [here.courseId, here.weekId]);

  const toggle = (key) =>
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (!tree) return <p className="tt-note">Đang tải…</p>;
  if (loadError) return <p className="tt-note" role="alert">{loadError}</p>;
  if (!tree.length) return <p className="tt-note">Chưa có khóa học.</p>;

  return (
    <ul className="tt" aria-label="Mục lục khóa học">
      {tree.map(({ course, weeks }) => {
        const courseKey = `c${course.id}`;
        const courseOpen = open.has(courseKey);
        return (
          <li key={course.id}>
            <div className={`tt-row tt-course ${String(course.id) === here.courseId ? "is-here" : ""}`}>
              <button
                type="button"
                className="tt-chevron"
                aria-expanded={courseOpen}
                aria-label={`${courseOpen ? "Thu gọn" : "Mở"} ${course.title}`}
                onClick={() => toggle(courseKey)}
              >
                {courseOpen ? "▾" : "▸"}
              </button>
              <Link to={`/teacher/courses/${course.id}`} title={course.title}>
                <span className="tt-badge tt-badge-course">KH</span>
                <span className="tt-text">{course.title}</span>
              </Link>
            </div>
            {courseOpen && (
              <ul className="tt-weeks">
                {weeks.map((week) => {
                  const weekKey = `w${week.id}`;
                  const weekOpen = open.has(weekKey);
                  const lessons = week.lessons || [];
                  return (
                    <li key={week.id}>
                      <div
                        className={`tt-row ${String(week.id) === here.weekId && !here.lessonId ? "is-current" : ""}`}
                      >
                        <button
                          type="button"
                          className="tt-chevron"
                          aria-expanded={weekOpen}
                          aria-label={`${weekOpen ? "Thu gọn" : "Mở"} tuần ${week.weekNumber}`}
                          onClick={() => toggle(weekKey)}
                          disabled={!lessons.length}
                        >
                          {lessons.length ? (weekOpen ? "▾" : "▸") : ""}
                        </button>
                        <Link to={teacherWeekLink(course.id, week.id)} title={week.title}>
                          <span className="tt-badge tt-badge-week">T{week.weekNumber}</span>
                          <span className="tt-text">{week.title}</span>
                        </Link>
                      </div>
                      {weekOpen && lessons.length > 0 && (
                        <ul className="tt-lessons">
                          {lessons.map((lesson, index) => (
                            <li key={lesson.id}>
                              <Link
                                to={teacherLessonLink(lesson.id)}
                                title={lesson.title}
                                className={
                                  String(lesson.id) === String(here.lessonId) ? "is-current" : ""
                                }
                              >
                                <span className="tt-badge tt-badge-lesson">B{index + 1}</span>
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
          {links.map(([to, label, icon]) => {
            const isCourseLink = to === "/teacher/courses";
            return (
              <div key={to} className={isCourseLink ? "tt-group" : undefined}>
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
                {isCourseLink && (
                  <>
                    <button
                      type="button"
                      className="tt-toggle"
                      aria-expanded={treeOpen}
                      aria-label={treeOpen ? "Thu gọn mục lục khóa học" : "Mở mục lục khóa học"}
                      onClick={() => setTreeOpen((open) => !open)}
                    >
                      {treeOpen ? "▾" : "▸"}
                    </button>
                    {treeOpen && <CourseTree pathname={pathname} search={search} />}
                  </>
                )}
              </div>
            );
          })}
        </section>
      </nav>
    </aside>
  );
}
