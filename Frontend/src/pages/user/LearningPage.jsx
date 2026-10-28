import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { useSuccessToast } from "../../components/common/Toast";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import Icon from "../../components/common/Icon";
import MaterialRow from "../../components/course/MaterialRow";
import ProgressRing from "../../components/course/ProgressRing";
import CompletionChecklist from "../../components/learning/CompletionChecklist";
import {
  completeLesson,
  getLesson,
  getStudentCurriculum,
  startLesson,
} from "../../services/courseService";
import { apiError } from "../../utils/apiError";
import { lessonLabel, lessonNeighbours, lessonState } from "../../utils/studentCurriculum";

function NeighbourLink({ item, direction }) {
  const label = direction === "prev" ? "← Bài trước" : "Bài tiếp →";
  if (!item) return <span className="sc-nav-link is-empty" aria-hidden="true" />;
  const { week, lesson } = item;
  const locked = lessonState(lesson) === "locked";
  const body = (
    <>
      <small>{label}</small>
      <span>
        Tuần {week.weekNumber} · {lesson.title}
      </span>
    </>
  );
  if (locked) {
    return (
      <div className={`sc-nav-link is-${direction} is-locked`} aria-disabled="true">
        {body}
        <span className="sc-nav-reason">
          <Icon name="lock" size={12} />
          Hoàn thành bài trước để mở
        </span>
      </div>
    );
  }
  return (
    <Link className={`sc-nav-link is-${direction}`} to={`/lessons/${lesson.id}`}>
      {body}
    </Link>
  );
}

export default function LearningPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [state, setState] = useState({ loading: true, completing: false, error: "", message: "" });
  useSuccessToast(state.message);

  useEffect(() => {
    getLesson(id)
      .then((data) => {
        setLesson(data);
        setState({ loading: false, completing: false, error: "", message: "" });
      })
      .catch((error) =>
        setState({
          loading: false,
          completing: false,
          error: error.response?.data?.message || "Không thể tải bài học",
          loadError: apiError(error, "Không thể tải bài học"),
          message: "",
        }),
      );
  }, [id]);

  const courseId = lesson?.courseId;
  function loadCurriculum() {
    // Điều hướng bài trước / sau là phần phụ: lỗi ở đây không chặn việc học.
    if (!courseId) return;
    getStudentCurriculum(courseId)
      .then(setWeeks)
      .catch(() => setWeeks([]));
  }
  useEffect(loadCurriculum, [courseId]);

  // Mở bài lần đầu → ghi nhận "Đang học" (không chặn việc học nếu lỗi).
  const shouldStart = lesson?.progressStatus === "AVAILABLE";
  useEffect(() => {
    if (!shouldStart) return;
    startLesson(id)
      .then((progress) =>
        setLesson((current) => ({
          ...current,
          progressStatus: progress.status,
          progressPercent: progress.progressPercent,
        })),
      )
      .catch(() => {});
  }, [id, shouldStart]);

  async function markComplete() {
    setState((s) => ({ ...s, completing: true, error: "", message: "" }));
    try {
      const completed = await completeLesson(id);
      setLesson((current) => ({
        ...current,
        progressStatus: completed.status,
        progressPercent: completed.progressPercent,
      }));
      setState((s) => ({ ...s, completing: false, message: "Bạn đã hoàn thành bài học này!" }));
      loadCurriculum();
    } catch (error) {
      setState((s) => ({
        ...s,
        completing: false,
        error: error.response?.data?.message || "Không thể cập nhật tiến độ",
      }));
    }
  }

  if (state.loading) return <LoadingState />;
  if (!lesson)
    return (
      <main className="container py-5">
        <ErrorState
          error={state.loadError}
          actions={[{ label: "Khóa học của tôi", to: "/courses" }]}
        />
      </main>
    );

  const practice = lesson.materials || [];
  const completed = lesson.progressStatus === "COMPLETED";
  const requirements = lesson.completionRequirements || [];
  const missing = requirements.filter((item) => !item.done);
  const { previous, next } = lessonNeighbours(weeks, lesson.id);
  const courseLink = `/courses/${lesson.courseId}`;

  return (
    <main className="sc-learning">
      <header className="sc-lesson-hero">
        <div className="container">
          <nav className="sc-crumbs" aria-label="Breadcrumb">
            <Link to={courseLink}>{lesson.courseTitle || "Khóa học"}</Link>
            <span aria-hidden="true">/</span>
            <Link to={`${courseLink}?week=${lesson.courseWeekId}`}>Tuần {lesson.weekNumber}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Bài {lesson.sortOrder}</span>
          </nav>
          <div className="sc-lesson-hero-row">
            <h1>{lesson.title}</h1>
            <span className={`sc-hero-status ${completed ? "is-done" : ""}`}>
              {completed && <Icon name="check" size={14} />}
              {lessonLabel(lesson)}
            </span>
          </div>
          {lesson.estimatedMinutes ? (
            <p className="sc-lesson-hero-meta">
              <Icon name="clock" size={14} />
              {lesson.estimatedMinutes} phút
            </p>
          ) : null}
        </div>
      </header>

      <div className="container sc-learning-grid">
        <section className="sc-learning-intro">
          {lesson.description && (
            <div className="sc-lead lesson-rich-text">{lesson.description}</div>
          )}
        </section>

        <aside className="sc-learning-aside" aria-label="Trong bài này">
          <div className="sc-aside-card">
            <div className="sc-aside-head">
              <ProgressRing percent={lesson.progressPercent} size={56} stroke={6} />
              <div>
                <h2>Trong bài này</h2>
                <p>{practice.length} học liệu</p>
              </div>
            </div>
            {practice.length ? (
              <ol className="sc-checklist">
                {practice.map((material) => (
                  <li key={`${material.type}-${material.id}`}>
                    <MaterialRow material={material} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="sc-muted">Bài này chưa có học liệu.</p>
            )}
            {weeks.length > 0 && (previous || next) && (
              <nav className="sc-lesson-nav" aria-label="Chuyển bài">
                <NeighbourLink item={previous} direction="prev" />
                <NeighbourLink item={next} direction="next" />
              </nav>
            )}
          </div>
        </aside>

        <section className="sc-learning-body" aria-label="Hoàn thành bài">
          {state.error && <div className="alert alert-danger mt-4">{state.error}</div>}
          <div className="sc-complete" id="complete">
            <div className="sc-complete-head">
              <h2>Hoàn thành bài</h2>
              {completed ? (
                <span className="sc-hero-status is-done">
                  <Icon name="check" size={14} /> Hoàn thành
                </span>
              ) : (
                <p>
                  {requirements.length
                    ? `Nộp đủ ${requirements.length} học liệu dưới đây, bài sẽ tự hoàn thành (còn ${missing.length}).`
                    : "Bài không có bài tập phải nộp. Học xong, bấm Hoàn thành bài."}
                </p>
              )}
            </div>
            {requirements.length > 0 && (
              <CompletionChecklist requirements={requirements} lessonId={lesson.id} />
            )}
            {!completed && requirements.length === 0 && (
              <button
                className="btn btn-primary btn-lg"
                onClick={markComplete}
                disabled={state.completing}
              >
                {state.completing ? (
                  "Đang lưu…"
                ) : (
                  <>
                    <Icon name="check" size={18} /> Hoàn thành bài
                  </>
                )}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
