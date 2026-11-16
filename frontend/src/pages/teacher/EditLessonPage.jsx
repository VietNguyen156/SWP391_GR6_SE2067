import { enumLabel } from "../../utils/statusLabels";
import LoadingState from "../../components/common/LoadingState";
import { useSuccessToast } from "../../components/common/Toast";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useConfirm } from "../../components/common/ConfirmDialog";
import ErrorState from "../../components/common/ErrorState";
import * as courseApi from "../../services/courseService";
import { teacherLessonLink, teacherMaterialLink } from "../../utils/lessonMaterials";
import { currentPath, returnLabel, safeReturnTo, withReturnTo } from "../../utils/returnTo";

const emptyContent = {
  contentType: "TEXT",
  title: "",
  body: "",
  resourceUrl: "",
};
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

export default function EditLessonPage() {
  const { id } = useParams();
  const confirm = useConfirm();
  const [params] = useSearchParams();
  const location = useLocation();
  const [form, setForm] = useState(null);
  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [contentForm, setContentForm] = useState(emptyContent);
  const [editingContent, setEditingContent] = useState(null);
  const [state, setState] = useState({ loading: true, saving: false, error: "", message: "" });
  useSuccessToast(state.message);

  async function load() {
    try {
      const [lesson, lessonContents] = await Promise.all([
        courseApi.getTeacherLesson(id),
        courseApi.getLessonContents(id),
      ]);
      setForm({
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description || "",
        estimatedMinutes: lesson.estimatedMinutes ?? "",
        courseTitle: lesson.courseTitle,
        courseWeekId: lesson.courseWeekId,
        weekNumber: lesson.weekNumber,
        weekTitle: lesson.weekTitle,
      });
      setQuizzes((lesson.materials || []).filter((item) => item.type === "QUIZ"));
      setContents(lessonContents);
      setState((value) => ({ ...value, loading: false, saving: false, error: "" }));
    } catch (error) {
      setState({
        loading: false,
        saving: false,
        error: errorMessage(error, "Không thể tải bài học"),
        message: "",
      });
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function run(task, success, after) {
    setState((value) => ({ ...value, saving: true, error: "", message: "" }));
    try {
      await task();
      if (after) after();
      await load();
      setState((value) => ({ ...value, saving: false, message: success }));
    } catch (error) {
      setState((value) => ({
        ...value,
        saving: false,
        error: errorMessage(error, "Không thể thực hiện thao tác"),
      }));
    }
  }

  function editContent(item) {
    setEditingContent(item.id);
    setContentForm({
      contentType: item.contentType,
      title: item.title || "",
      body: item.body || "",
      resourceUrl: item.resourceUrl || "",
    });
  }
  function moveContent(index, step) {
    const ids = contents.map((item) => item.id);
    const to = index + step;
    if (to < 0 || to >= ids.length) return;
    [ids[index], ids[to]] = [ids[to], ids[index]];
    run(() => courseApi.reorderLessonContents(id, ids), "Đã đổi thứ tự");
  }
  function submitContent(event) {
    event.preventDefault();
    const payload = contentForm;
    run(
      () =>
        editingContent
          ? courseApi.updateLessonContent(editingContent, payload)
          : courseApi.createLessonContent(id, payload),
      editingContent ? "Đã cập nhật nội dung" : "Đã thêm nội dung",
      () => {
        setEditingContent(null);
        setContentForm(emptyContent);
      },
    );
  }

  if (state.loading) return <LoadingState />;
  if (!form)
    return (
      <main className="container py-5">
        <ErrorState
          message={state.error}
          onRetry={load}
          actions={[{ label: "Khóa học", to: "/teacher/courses" }]}
        />
      </main>
    );

  const here = currentPath(location);
  const back = safeReturnTo(params.get("returnTo"), teacherLessonLink(id));
  const backText = returnLabel(back, "Về bài học");

  return (
    <main className="container py-5 course-shell lesson-studio">
      <div className="lesson-studio-head mb-4">
        <div>
          <p className="lesson-studio-context">
            {form.courseTitle} · {`Tuần ${form.weekNumber}: ${form.weekTitle}`}
          </p>
          <h1>{form.title}</h1>
          <p>Bài giảng của bài học</p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-self-start">
          <Link className="btn btn-light" to={back}>
            ← {backText}
          </Link>
          {form.courseWeekId && (
            <Link
              className="btn btn-outline-primary"
              to={withReturnTo(`/teacher/lessons/${id}/week-edit`, here)}
            >
              Sửa thông tin bài
            </Link>
          )}
        </div>
      </div>
      {state.error && (
        <div className="alert alert-danger" role="alert">
          {state.error}
        </div>
      )}

      <section className="card border-0 shadow-sm rounded-4 p-4 p-lg-5 mb-4" id="lecture">
        <SectionTitle
          number="01"
          title="Bài giảng"
          text="Văn bản, video, audio, PDF, hình hoặc liên kết"
          count={`${contents.length} mục`}
        />
        <div className="studio-item-list mb-4">
          {contents.length === 0 && <div className="content-empty">Chưa có nội dung học.</div>}
          {contents.map((item, index) => (
            <article className="studio-item" key={item.id}>
              <div className="studio-item-move">
                <button
                  type="button"
                  aria-label="Chuyển lên"
                  disabled={index === 0 || state.saving}
                  onClick={() => moveContent(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Chuyển xuống"
                  disabled={index === contents.length - 1 || state.saving}
                  onClick={() => moveContent(index, 1)}
                >
                  ↓
                </button>
              </div>
              <div>
                <div className="d-flex gap-2 align-items-center">
                  <strong>{item.title || item.contentType}</strong>
                  <span className="badge text-bg-light">{enumLabel(item.contentType)}</span>
                </div>
                <p>{item.contentType === "TEXT" ? item.body : item.resourceUrl}</p>
              </div>
              <div className="studio-item-actions">
                <button onClick={() => editContent(item)}>Sửa</button>
                <button
                  className="danger"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Xóa bài giảng",
                      message: `Xóa “${item.title || "nội dung này"}”?`,
                      confirmLabel: "Xóa",
                      danger: true,
                    });
                    if (ok) run(() => courseApi.deleteLessonContent(item.id), "Đã xóa nội dung");
                  }}
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
        <form className="studio-form-panel" onSubmit={submitContent}>
          <h3>{editingContent ? "Cập nhật nội dung" : "Thêm nội dung mới"}</h3>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Loại</label>
              <select
                className="form-select"
                value={contentForm.contentType}
                onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value })}
              >
                <option value="TEXT">{enumLabel("TEXT")}</option>
                <option value="VIDEO">{enumLabel("VIDEO")}</option>
                <option value="AUDIO">{enumLabel("AUDIO")}</option>
                <option value="PDF">{enumLabel("PDF")}</option>
                <option value="IMAGE">{enumLabel("IMAGE")}</option>
                <option value="LINK">{enumLabel("LINK")}</option>
              </select>
            </div>
            <div className="col-md-9">
              <label className="form-label">Tiêu đề</label>
              <input
                className="form-control"
                maxLength="200"
                value={contentForm.title}
                onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
              />
            </div>
            {contentForm.contentType === "TEXT" ? (
              <div className="col-12">
                <label className="form-label">Nội dung văn bản</label>
                <textarea
                  className="form-control"
                  rows="6"
                  required
                  value={contentForm.body}
                  onChange={(e) => setContentForm({ ...contentForm, body: e.target.value })}
                />
              </div>
            ) : (
              <div className="col-12">
                <label className="form-label">URL tài nguyên</label>
                <input
                  className="form-control"
                  type="url"
                  maxLength="1000"
                  required
                  value={contentForm.resourceUrl}
                  onChange={(e) => setContentForm({ ...contentForm, resourceUrl: e.target.value })}
                />
              </div>
            )}
            <div className="col-12 text-end">
              <button className="btn btn-primary" disabled={state.saving}>
                {editingContent ? "Cập nhật" : "Thêm nội dung"}
              </button>
              {editingContent && (
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => {
                    setEditingContent(null);
                    setContentForm(emptyContent);
                  }}
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      <section className="card border-0 shadow-sm rounded-4 p-4 p-lg-5">
        <SectionTitle
          number="02"
          title="Quiz của bài"
          text="Lấy câu hỏi từ ngân hàng câu hỏi"
          count={`${quizzes.length} quiz`}
        />
        <div className="studio-item-list mb-3">
          {quizzes.length === 0 && <div className="content-empty">Bài học chưa có quiz.</div>}
          {quizzes.map((quiz) => (
            <div className="studio-item" key={quiz.id}>
              <div>
                <span className="badge text-bg-warning">QUIZ</span>
                <strong className="ms-2">{quiz.title}</strong>
              </div>
              <div className="studio-item-actions">
                <Link to={teacherMaterialLink(quiz, here)}>Sửa</Link>
              </div>
            </div>
          ))}
        </div>
        {form.courseWeekId && (
          <Link
            className="btn btn-outline-primary"
            to={withReturnTo(
              `/teacher/quizzes/create?courseId=${form.courseId}&weekId=${form.courseWeekId}&lessonId=${id}`,
              here,
            )}
          >
            + Tạo quiz cho bài này
          </Link>
        )}
      </section>
    </main>
  );
}

function SectionTitle({ number, title, text, count }) {
  return (
    <div className="studio-section-title">
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {count && <b className="ms-auto">{count}</b>}
    </div>
  );
}
