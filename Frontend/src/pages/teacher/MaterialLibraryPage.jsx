import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "../../components/common/Icon";
import LoadingState from "../../components/common/LoadingState";
import { useConfirm } from "../../components/common/ConfirmDialog";
import MaterialFilter from "../../components/course/MaterialFilter";
import MaterialLine from "../../components/course/MaterialLine";
import * as courseApi from "../../services/courseService";
import { loadMaterialDetails, removeMaterial } from "../../services/materialService";
import { lastCourse, rememberLastCourse } from "../../utils/lastCourse";
import {
  LIBRARY_TYPES,
  materialLabel,
  teacherLessonLink,
  teacherWeekLink,
} from "../../utils/lessonMaterials";
import { buildRows, countTypes, filterRows, groupRows } from "../../utils/materialLibrary";

// Quá ngưỡng này thì chỉ vẽ dần từng 50 nhóm.
const LARGE = 500;
const LIBRARY = { from: "library" };
const PAGE = 50;

async function loadLibrary() {
  const courses = await courseApi.getTeacherCourses();
  const [curriculaList, details] = await Promise.all([
    Promise.all(courses.map((course) => courseApi.getTeacherCurriculum(course.id))),
    loadMaterialDetails(LIBRARY_TYPES),
  ]);
  const curricula = Object.fromEntries(courses.map((course, i) => [course.id, curriculaList[i]]));
  const rows = buildRows(courses, curricula, details).filter((row) =>
    LIBRARY_TYPES.includes(row.type),
  );
  return { courses, curricula, rows };
}

/** Thư viện học liệu: tìm, sửa, xóa mọi học liệu theo Khóa · Tuần · Bài. Tạo mới từ bài học. */
export default function MaterialLibraryPage() {
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState(PAGE);

  async function load() {
    try {
      setData(await loadLibrary());
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Không thể tải học liệu");
    }
  }
  useEffect(() => {
    load();
  }, []);

  // Loại không thuộc thư viện → về "Tất cả", không thêm lịch sử.
  const rawType = params.get("type") || "";
  useEffect(() => {
    if (rawType && !LIBRARY_TYPES.includes(rawType)) {
      const next = new URLSearchParams(params);
      next.delete("type");
      setParams(next, { replace: true });
    }
  }, [rawType]);

  const courses = data?.courses || [];
  const remembered = lastCourse();
  const course =
    params.get("course") || (courses.some((c) => String(c.id) === remembered) ? remembered : "all");
  const filters = {
    course,
    week: course === "all" ? "" : params.get("week") || "",
    type: LIBRARY_TYPES.includes(rawType) ? rawType : "",
    q: params.get("q") || "",
  };
  const searching = Boolean(filters.q.trim());
  const weeks = course === "all" ? [] : data?.curricula[course] || [];
  const rows = data?.rows || [];
  const filtered = useMemo(() => filterRows(rows, filters), [rows, ...Object.values(filters)]);
  const counts = useMemo(() => countTypes(rows, filters), [rows, ...Object.values(filters)]);
  const groups = useMemo(() => (searching ? [] : groupRows(filtered)), [filtered, searching]);
  const visibleGroups = rows.length > LARGE ? groups.slice(0, shown) : groups;
  const listRef = useRef(null);

  // Tiêu đề tuần trong suốt (hòa vào nền gradient của trang); chỉ có nền khi đang dính trên đầu.
  useEffect(() => {
    const heads = listRef.current?.querySelectorAll(".ml-group-head") || [];
    if (!heads.length) return undefined;
    const top = parseFloat(getComputedStyle(heads[0]).top) || 0;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle(
            "is-stuck",
            entry.intersectionRatio < 1 && entry.boundingClientRect.top <= top + 1,
          ),
        ),
      { rootMargin: `-${top + 1}px 0px 0px 0px`, threshold: [1] },
    );
    heads.forEach((head) => observer.observe(head));
    return () => observer.disconnect();
  }, [visibleGroups]);

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setParams(next, { replace: true });
    setShown(PAGE);
  }

  function chooseCourse(value) {
    if (value !== "all") rememberLastCourse(value);
    update({ course: value, week: "" });
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Xóa ${materialLabel[row.type]}`,
      message: `Xóa “${row.title}”?`,
      confirmLabel: "Xóa",
      danger: true,
    });
    if (!ok) return;
    try {
      await removeMaterial(row.type, row.id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Không thể xóa học liệu");
    }
  }

  if (!data && !error) return <LoadingState />;

  const courseHasNothing =
    !searching && course !== "all" && !rows.some((r) => String(r.courseId) === course);

  return (
    <main className="container content-shell ml-page">
      <header className="ml-head">
        <h1>Thư viện học liệu</h1>
        <input
          className="form-control ml-search"
          type="search"
          aria-label="Tìm học liệu trên mọi khóa"
          placeholder="Tìm học liệu…"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
        />
      </header>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="ml-filters">
        <select
          className="form-select"
          aria-label="Khóa học"
          value={course}
          disabled={searching}
          onChange={(e) => chooseCourse(e.target.value)}
        >
          <option value="all">Tất cả khóa</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {course !== "all" && (
          <select
            className="form-select"
            aria-label="Tuần"
            value={filters.week}
            disabled={searching}
            onChange={(e) => update({ week: e.target.value })}
          >
            <option value="">Tất cả tuần</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Tuần {w.weekNumber}: {w.title}
              </option>
            ))}
          </select>
        )}
        <MaterialFilter
          types={LIBRARY_TYPES}
          value={filters.type}
          counts={counts}
          onChange={(type) => update({ type })}
        />
      </div>

      {!filtered.length ? (
        <div className="ml-empty">
          <Icon name="cards" size={28} />
          <p>{courseHasNothing ? "Chưa có học liệu" : "Không có học liệu phù hợp"}</p>
          {courseHasNothing && (
            <Link className="btn btn-primary" to={`/teacher/courses/${course}`}>
              Mở khóa học
            </Link>
          )}
        </div>
      ) : searching ? (
        <ul className="ml-list ml-block ml-flat">
          {filtered.map((row) => (
            <MaterialLine
              key={row.key}
              row={row}
              q={filters.q}
              where
              ctx={LIBRARY}
              onRemove={remove}
            />
          ))}
        </ul>
      ) : (
        <div ref={listRef}>
          {visibleGroups.map((group) => (
            <section className="ml-group" key={group.key}>
              <h2 className="ml-group-head">
                <Link className="ml-group-link" to={teacherWeekLink(group.courseId, group.weekId)}>
                  {group.courseTitle} · Tuần {group.weekNumber}
                  {group.weekTitle ? `: ${group.weekTitle}` : ""}
                </Link>
                <small>{group.count} học liệu</small>
              </h2>
              <div className="ml-block">
                {group.lessons.map((lesson) => (
                  <div className="ml-lesson" key={lesson.lessonId}>
                    <Link className="ml-lesson-link" to={teacherLessonLink(lesson.lessonId)}>
                      <span className="ml-lesson-no">Bài {lesson.lessonNo}</span>
                      <span className="ml-lesson-name">{lesson.lessonTitle}</span>
                    </Link>
                    <ul className="ml-list">
                      {lesson.items.map((row) => (
                        <MaterialLine key={row.key} row={row} ctx={LIBRARY} onRemove={remove} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {visibleGroups.length < groups.length && (
            <button
              type="button"
              className="btn btn-outline-primary ml-more"
              onClick={() => setShown((n) => n + PAGE)}
            >
              Xem thêm
            </button>
          )}
        </div>
      )}
    </main>
  );
}
