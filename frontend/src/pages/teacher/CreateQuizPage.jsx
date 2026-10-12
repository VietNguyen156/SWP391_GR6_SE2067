import { useMemo, useState } from "react";
import EditGate, { editTitle } from "../../components/common/EditGate";
import { quizToForm } from "../../utils/editForms";
import useEditForm from "../../utils/useEditForm";
import { enumLabel } from "../../utils/statusLabels";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { currentPath, withReturnTo } from "../../utils/returnTo";
import { useReturnTo } from "../../utils/useReturnTo";
import { questionApi, quizApi } from "../../services/assessmentService";
import { getTeacherCourses, getTeacherCurriculum } from "../../services/courseService";
import LessonPlacement from "../../components/course/LessonPlacement";

const emptyForm = {
  title: "",
  description: "",
  courseId: "",
  courseWeekId: "",
  lessonId: "",
  timeLimitMinutes: 30,
  questionIds: [],
};

export default function CreateQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const back = useReturnTo("/teacher/questions?tab=quizzes", "Danh sách quiz");
  const edit = useEditForm(async () => {
    const [questions, courses, quiz] = await Promise.all([
      questionApi.list(),
      getTeacherCourses(),
      id ? quizApi.teacherGet(id) : null,
    ]);
    const form = quiz
      ? quizToForm(quiz)
      : {
          ...emptyForm,
          courseId: params.get("courseId") || "",
          courseWeekId: params.get("weekId") || "",
          lessonId: params.get("lessonId") || "",
        };
    const weeks = form.courseId ? await getTeacherCurriculum(form.courseId) : [];
    return { questions, courses, weeks, inUse: Boolean(quiz?.inUse), name: quiz?.title, form };
  }, [id]);
  const { form, setForm } = edit;
  const { questions = [], courses = [], weeks = [], inUse = false } = edit.extra;
  const setWeeks = (list) => edit.setExtra({ weeks: list });
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ saving: false, error: "" });

  async function chooseCourse(courseId) {
    setForm((current) => ({ ...current, courseId, courseWeekId: "", lessonId: "" }));
    setWeeks(courseId ? await getTeacherCurriculum(courseId) : []);
  }

  function toggleQuestion(questionId) {
    setForm((current) => ({
      ...current,
      questionIds: current.questionIds.includes(questionId)
        ? current.questionIds.filter((value) => value !== questionId)
        : [...current.questionIds, questionId],
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!form.questionIds.length) {
      setState((current) => ({ ...current, error: "Hãy chọn ít nhất một câu hỏi." }));
      return;
    }
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      const { courseWeekId, ...rest } = form;
      const payload = {
        ...rest,
        courseId: form.courseId ? Number(form.courseId) : null,
        lessonId: form.lessonId ? Number(form.lessonId) : null,
        timeLimitMinutes: Number(form.timeLimitMinutes),
      };
      if (id) await quizApi.update(id, payload);
      else await quizApi.create(payload);
      navigate(back.to, { replace: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Không thể lưu bài kiểm tra",
      }));
    }
  }

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) =>
        `${question.questionText} ${question.difficulty}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [questions, query],
  );

  if (!edit.ready) return <EditGate edit={edit} back={back} />;
  return (
    <main className="container py-5 content-shell">
      <form onSubmit={save}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h2 fw-bold mb-0">
              {editTitle(Boolean(id), edit.extra.name, "Tạo bài kiểm tra")}
            </h1>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to={back.to}>
              Hủy
            </Link>
            <button className="btn btn-primary" disabled={state.saving || inUse}>
              {state.saving ? "Đang lưu…" : "Lưu bài kiểm tra"}
            </button>
          </div>
        </div>
        {inUse && (
          <div className="alert alert-warning">
            Quiz đã có học viên làm nên không thể sửa. Hãy tạo quiz mới nếu cần thay đổi.
          </div>
        )}
        {state.error && <div className="alert alert-danger">{state.error}</div>}
        <div className="row g-4">
          <section className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 content-sticky-form">
              <label className="form-label">Tiêu đề</label>
              <input
                className="form-control mb-3"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength="220"
                required
              />
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-control mb-3"
                rows="4"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="mb-3">
                <LessonPlacement
                  courses={courses}
                  weeks={weeks}
                  value={form}
                  onCourse={chooseCourse}
                  onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
                  optional
                />
              </div>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">Thời gian (phút)</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    max="300"
                    value={form.timeLimitMinutes}
                    onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </section>
          <section className="col-lg-7">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 fw-bold mb-1">Chọn câu hỏi</h2>
                <small className="text-secondary">Danh sách cuộn độc lập để trang luôn gọn.</small>
              </div>
              <span className="badge text-bg-primary">{form.questionIds.length} đã chọn</span>
            </div>
            <input
              className="form-control mb-2"
              placeholder="Tìm câu hỏi theo nội dung, kỹ năng…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="quiz-question-scroll">
              {filteredQuestions.map((question, index) => (
                <label
                  className={`question-picker ${form.questionIds.includes(question.id) ? "selected" : ""}`}
                  key={question.id}
                >
                  <input
                    type="checkbox"
                    checked={form.questionIds.includes(question.id)}
                    onChange={() => toggleQuestion(question.id)}
                  />
                  <span className="question-number">{index + 1}</span>
                  <span>
                    <strong>{question.questionText}</strong>
                    <small>{enumLabel(question.difficulty)}</small>
                  </span>
                </label>
              ))}
            </div>
            {!filteredQuestions.length && (
              <div className="content-empty">
                Không có câu hỏi phù hợp.{" "}
                <Link to={withReturnTo("/teacher/questions/new", currentPath(location))}>
                  Tạo câu hỏi mới
                </Link>
                .
              </div>
            )}
          </section>
        </div>
      </form>
    </main>
  );
}
