import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { useConfirm } from "../../components/common/ConfirmDialog";
import Dropdown from "../../components/course/Dropdown";
import MaterialIcon from "../../components/course/MaterialIcon";
import Pager from "../../components/course/Pager";
import {
  FlashcardPreview,
  GrammarPreview,
  ListeningPreview,
  ReadingPreview,
  SpeakingPreview,
} from "../../components/material-view/Previews";
import { getTeacherCourses, getTeacherCurriculum } from "../../services/courseService";
import {
  flashcardApi,
  grammarApi,
  listeningApi,
  readingApi,
  speakingApi,
} from "../../services/learningContentService";
import { removeMaterial } from "../../services/materialService";
import { apiError } from "../../utils/apiError";
import {
  addMaterialLinks,
  materialContext,
  materialExitLink,
  materialLabel,
  sortByType,
  teacherLessonLink,
  teacherMaterialContent,
  teacherMaterialEdit,
  teacherMaterialView,
  teacherWeekLink,
} from "../../utils/lessonMaterials";
import { buildRows } from "../../utils/materialLibrary";
import { materialPosition } from "../../utils/materialNavigation";

const GET = {
  GRAMMAR: grammarApi.teacherGet,
  FLASHCARD: flashcardApi.teacherGet,
  LISTENING: listeningApi.teacherGet,
  READING: readingApi.teacherGet,
  SPEAKING: speakingApi.teacherGet,
};
// Đã có học viên làm thì khóa cả nội dung (các loại còn lại chỉ chặn xóa).
const LOCKED_CONTENT = ["LISTENING", "READING", "SPEAKING"];
const PREVIEW = {
  GRAMMAR: GrammarPreview,
  FLASHCARD: FlashcardPreview,
  LISTENING: ListeningPreview,
  READING: ReadingPreview,
  SPEAKING: SpeakingPreview,
};

/** Khóa chứa học liệu + chương trình học (tuần → bài → học liệu) của khóa đó. */
async function loadCourse(item, ctx, cache) {
  const courses = cache.courses || (cache.courses = await getTeacherCourses());
  const curriculum = async (courseId) =>
    cache.weeks[courseId] || (cache.weeks[courseId] = await getTeacherCurriculum(courseId));
  const hasWeek = (weeks) => weeks.some((w) => String(w.id) === String(item.courseWeekId));
  const hasLesson = (weeks) =>
    weeks.some((w) => (w.lessons || []).some((l) => String(l.id) === String(ctx.lessonId)));
  const wanted = ctx.from === "lesson" ? hasLesson : hasWeek;
  // Thử khóa đã biết trước, rồi mới dò các khóa còn lại.
  const ordered = [...courses].sort(
    (a, b) =>
      Number(Boolean(cache.weeks[b.id]) || b.id === item.courseId) -
      Number(Boolean(cache.weeks[a.id]) || a.id === item.courseId),
  );
  for (const course of ordered) {
    const weeks = await curriculum(course.id);
    if (wanted(weeks)) return { course, weeks };
  }
  throw new Error("Không tìm thấy khóa học chứa học liệu này");
}

function visibility(course, week) {
  if (course?.status && course.status !== "PUBLISHED") return "Khóa đang ẩn";
  if (week?.status && week.status !== "PUBLISHED") return "Tuần đang ẩn";
  return "Đang hiển thị";
}

/**
 * Trang Xem học liệu của giáo viên. Cột trái theo ngữ cảnh (?from=library: cùng loại trong khóa;
 * ?from=lesson&lessonId=: mọi học liệu của bài); cột phải là nội dung xem trước, nút Chỉnh sửa nội dung; ⋯ gồm Sửa thông tin và Xóa.
 */
export default function MaterialViewPage({ type: routeType }) {
  const { id: routeId } = useParams();
  const [params] = useSearchParams();
  const ctx = materialContext(params);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const cache = useRef({ weeks: {} });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    setError(null);
    setActionError("");
    (async () => {
      const item = await GET[routeType](routeId);
      const { course, weeks } = await loadCourse(item, ctx, cache.current);
      if (active) setData({ type: routeType, id: routeId, item, course, weeks });
    })().catch((e) => active && setError(apiError(e, "Không thể tải học liệu")));
    return () => {
      active = false;
    };
  }, [routeType, routeId, ctx.from, ctx.lessonId]);

  if (error)
    return (
      <main className="container cs-page">
        <ErrorState
          error={error}
          actions={[{ label: "Quay lại", to: materialExitLink(routeType, ctx) }]}
        />
      </main>
    );
  // Giữ trang cũ trong lúc tải học liệu mới để chuyển qua lại không bị nháy.
  if (!data) return <LoadingState rows={3} label="Đang tải học liệu" />;

  // Hiển thị theo dữ liệu đã tải (không theo URL) để không ghép nhầm loại trong lúc đang tải.
  const { type, id, item, course, weeks } = data;
  const rows = buildRows([course], { [course.id]: weeks });
  const current = rows.find((r) => r.type === type && String(r.id) === String(id));
  const week = weeks.find((w) => String(w.id) === String(current?.weekId ?? item.courseWeekId));
  const inLesson = ctx.from === "lesson";
  const navRows = inLesson
    ? sortByType(rows.filter((r) => String(r.lessonId) === String(ctx.lessonId)))
    : rows.filter((r) => r.type === type);
  const lessonRow = inLesson
    ? rows.find((r) => String(r.lessonId) === String(ctx.lessonId)) || current
    : null;
  const lessonInfo = inLesson
    ? weeks
        .flatMap((w) => (w.lessons || []).map((l) => ({ ...l, week: w })))
        .find((l) => String(l.id) === String(ctx.lessonId))
    : null;
  const position = inLesson ? materialPosition(navRows, type, id) : null;
  const viewOf = (row) => teacherMaterialView(row.type, row.id, ctx);
  const label = materialLabel[type];
  const Preview = PREVIEW[type];

  async function remove() {
    const ok = await confirm({
      title: `Xóa ${label}`,
      message: `Xóa “${item.title}”? Không thể hoàn tác.`,
      confirmLabel: "Xóa",
      danger: true,
    });
    if (!ok) return;
    try {
      await removeMaterial(type, item.id);
      navigate(materialExitLink(type, ctx), { replace: true });
    } catch (e) {
      setActionError(e.response?.data?.message || "Không thể xóa học liệu");
    }
  }

  const crumbs = inLesson
    ? [
        { label: "Khóa học", to: "/teacher/courses" },
        { label: course.title, to: `/teacher/courses/${course.id}` },
        {
          label: `Tuần ${lessonInfo?.week.weekNumber}`,
          to: teacherWeekLink(course.id, lessonInfo?.week.id),
        },
        { label: `Bài ${lessonInfo?.sortOrder}`, to: teacherLessonLink(ctx.lessonId) },
      ]
    : [
        { label: "Thư viện", to: "/teacher/library" },
        { label, to: `/teacher/library?type=${type}` },
      ];

  // Cột trái: nhóm theo tuần (thư viện) hoặc danh sách học liệu của bài.
  const groups = [];
  for (const row of navRows) {
    const key = inLesson ? "lesson" : row.weekId;
    let group = groups.find((g) => g.key === key);
    if (!group) groups.push((group = { key, title: `Tuần ${row.weekNumber}`, rows: [] }));
    group.rows.push(row);
  }
  const rowLabel = (row) => (inLesson ? row.title : `Bài ${row.lessonNo} · ${row.title}`);
  const isCurrent = (row) => row.type === type && String(row.id) === String(id);

  return (
    <main className="container mv-page">
      <div className="mv-layout">
        <aside
          className="mv-nav"
          aria-label={inLesson ? "Học liệu của bài" : `${label} trong khóa`}
        >
          <div className="mv-nav-head">
            {inLesson ? (
              <Link to={teacherLessonLink(ctx.lessonId)} className="mv-nav-lesson">
                <span>
                  Tuần {lessonInfo?.week.weekNumber} · Bài {lessonInfo?.sortOrder}
                </span>
                <strong>{lessonInfo?.title}</strong>
              </Link>
            ) : (
              <>
                <strong>{course.title}</strong>
                <span>
                  {navRows.length} {label}
                </span>
              </>
            )}
          </div>
          {groups.map((group) => (
            <div className="mv-nav-group" key={group.key}>
              {!inLesson && <h2>{group.title}</h2>}
              <ul>
                {group.rows.map((row) => (
                  <li key={row.key}>
                    <Link
                      to={viewOf(row)}
                      className={`mv-nav-item ${isCurrent(row) ? "is-current" : ""}`}
                      aria-current={isCurrent(row) ? "page" : undefined}
                    >
                      {inLesson && <MaterialIcon type={row.type} />}
                      <span>{rowLabel(row)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {inLesson && lessonInfo && (
            <div className="mv-nav-add">
              <Dropdown
                label="+ Thêm học liệu"
                ariaLabel="Thêm học liệu vào bài"
                align="start"
                toggleClassName="btn btn-outline-primary btn-sm w-100"
                items={addMaterialLinks(course.id, lessonInfo.week.id, ctx.lessonId).map((x) => ({
                  label: x.label,
                  to: x.to,
                }))}
              />
            </div>
          )}
        </aside>

        <section className="mv-main">
          <label className="mv-switch">
            <span>Chuyển học liệu</span>
            <select
              className="form-select"
              value={`${type}-${id}`}
              onChange={(e) => {
                const row = navRows.find((r) => r.key === e.target.value);
                if (row) navigate(viewOf(row));
              }}
            >
              {groups.map((group) => (
                <optgroup key={group.key} label={inLesson ? lessonInfo?.title : group.title}>
                  {group.rows.map((row) => (
                    <option key={row.key} value={row.key}>
                      {inLesson ? `${materialLabel[row.type]} · ${row.title}` : rowLabel(row)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <nav className="cs-breadcrumb mv-crumbs" aria-label="Breadcrumb">
            {crumbs.map((c) => (
              <span key={c.to + c.label}>
                <Link to={c.to}>{c.label}</Link>
                <span aria-hidden="true"> / </span>
              </span>
            ))}
            <span aria-current="page">{item.title}</span>
          </nav>

          <header className="mv-head">
            <div className="mv-head-main">
              <span className="mv-kind">
                <MaterialIcon type={type} /> {label}
              </span>
              <h1>{item.title}</h1>
              <p className="mv-meta">
                {course.title}
                {current && ` · Tuần ${current.weekNumber} · Bài ${current.lessonNo}`} ·{" "}
                {visibility(course, week)}
              </p>
            </div>
            <div className="mv-head-actions">
              <Link className="btn btn-primary" to={teacherMaterialContent(type, id, ctx)}>
                Chỉnh sửa nội dung
              </Link>
              <Dropdown
                label="⋯"
                ariaLabel={`Tùy chọn “${item.title}”`}
                toggleClassName="cs-icon-btn"
                items={[
                  { label: "Sửa thông tin", to: teacherMaterialEdit(type, id, ctx) },
                  {
                    label: "Xóa",
                    onClick: remove,
                    danger: true,
                    disabled: item.inUse,
                    reason: "Đã có học viên làm bài nên không thể xóa.",
                  },
                ]}
              />
            </div>
          </header>
          {inLesson && position && (
            <Pager
              previous={
                position.previous && { to: viewOf(position.previous), label: "Học liệu trước" }
              }
              next={position.next && { to: viewOf(position.next), label: "Học liệu sau" }}
            />
          )}
          {item.inUse && (
            <p className="mv-note">
              {LOCKED_CONTENT.includes(type)
                ? "Đã có học viên làm bài: nội dung không sửa hoặc xóa được."
                : "Đã có học viên học: không xóa được để giữ tiến độ của học viên."}
            </p>
          )}
          {actionError && (
            <div className="alert alert-danger" role="alert">
              {actionError}
            </div>
          )}

          <div className="mv-content">
            <Preview item={item} />
          </div>
        </section>
      </div>
    </main>
  );
}
