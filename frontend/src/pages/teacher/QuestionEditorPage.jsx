import { useMemo, useState } from "react";
import EditGate, { editTitle } from "../../components/common/EditGate";
import { questionToForm } from "../../utils/editForms";
import useEditForm from "../../utils/useEditForm";
import PageHeader from "../../components/common/PageHeader";
import { enumLabel } from "../../utils/statusLabels";
import { Link, useNavigate, useParams } from "react-router-dom";
import { questionApi } from "../../services/assessmentService";
import { getTeacherCourses, getTeacherCurriculum } from "../../services/courseService";
import { useReturnTo } from "../../utils/useReturnTo";

const makeOptions = () =>
  Array.from({ length: 4 }, (_, index) => ({ content: "", correct: index === 0 }));

const blank = {
  lessonId: "",
  questionText: "",
  explanation: "",
  difficulty: "MEDIUM",
  options: makeOptions(),
};

export default function QuestionEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const back = useReturnTo("/teacher/questions", "Ngân hàng câu hỏi");
  const editing = Boolean(id);
  const edit = useEditForm(async () => {
    const courses = await getTeacherCourses();
    const curriculumRows = await Promise.all(
      courses.map(async (course) => {
        try {
          const weeks = await getTeacherCurriculum(course.id);
          return weeks.flatMap((week) =>
            (week.lessons || []).map((lesson) => ({
              id: lesson.id,
              label: `${course.title} · Tuần ${week.weekNumber} · Bài ${lesson.sortOrder}: ${lesson.title}`,
            })),
          );
        } catch {
          return [];
        }
      }),
    );
    const question = editing ? await questionApi.get(id) : null;
    return {
      lessons: curriculumRows.flat(),
      inUse: Boolean(question?.inUse),
      name: question?.questionText,
      form: question ? questionToForm(question) : blank,
    };
  }, [id]);
  const { form, setForm } = edit;
  const { lessons = [], inUse = false } = edit.extra;
  const [lessonQuery, setLessonQuery] = useState("");
  const [state, setState] = useState({ saving: false, error: "" });

  const filteredLessons = useMemo(() => {
    const needle = lessonQuery.trim().toLowerCase();
    if (!needle) return lessons;
    // Luôn giữ bài đang chọn trong danh sách để <select> không mất giá trị khi lọc.
    return lessons.filter(
      (lesson) =>
        lesson.label.toLowerCase().includes(needle) || String(lesson.id) === form?.lessonId,
    );
  }, [lessonQuery, lessons, form?.lessonId]);

  function updateOption(index, patch) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => {
        if (optionIndex === index) return { ...option, ...patch };
        if (patch.correct) return { ...option, correct: false };
        return option;
      }),
    }));
  }

  async function save(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      const payload = {
        ...form,
        lessonId: form.lessonId ? Number(form.lessonId) : null,
      };
      if (editing) await questionApi.update(id, payload);
      else await questionApi.create(payload);
      navigate(back.to, { replace: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Không thể lưu câu hỏi",
      }));
    }
  }

  if (!edit.ready) return <EditGate edit={edit} back={back} />;

  return (
    <main className="container content-shell teacher-editor-shell">
      <PageHeader
        crumbs={[back]}
        title={editTitle(
          editing,
          edit.extra.name &&
            (edit.extra.name.length > 60 ? edit.extra.name.slice(0, 60) + "…" : edit.extra.name),
          "Tạo câu hỏi mới",
        )}
      />

      {inUse && (
        <div className="alert alert-warning">
          Câu hỏi thuộc quiz đã có học viên làm nên không thể sửa. Hãy tạo câu hỏi mới.
        </div>
      )}

      {state.error && <div className="alert alert-danger">{state.error}</div>}

      <form className="teacher-editor-card" onSubmit={save}>
        <section className="teacher-editor-section">
          <div className="teacher-editor-section-head">
            <div>
              <span className="teacher-step-badge">1</span>
              <div>
                <h2>Phân loại câu hỏi</h2>
                <p>Chọn độ khó và bài học liên quan.</p>
              </div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Độ khó</label>
              <select
                className="form-select"
                value={form.difficulty}
                onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
              >
                {["BEGINNER", "EASY", "MEDIUM", "HARD", "ADVANCED"].map((value) => (
                  <option key={value} value={value}>
                    {enumLabel(value)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Tìm bài học</label>
              <input
                className="form-control"
                value={lessonQuery}
                onChange={(event) => setLessonQuery(event.target.value)}
                placeholder="Tên khóa học, tuần hoặc bài…"
              />
            </div>
            <div className="col-12">
              <label className="form-label">Bài học</label>
              <select
                className="form-select"
                value={form.lessonId}
                onChange={(event) => setForm({ ...form, lessonId: event.target.value })}
              >
                <option value="">Không gắn bài học</option>
                {filteredLessons.map((lesson) => (
                  <option key={lesson.id} value={String(lesson.id)}>
                    {lesson.label}
                  </option>
                ))}
              </select>
              {!lessons.length && (
                <div className="form-hint warning">
                  Chưa có bài học theo tuần. Hãy tạo bài học trong phần Cấu trúc khóa học trước.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="teacher-editor-section">
          <div className="teacher-editor-section-head">
            <div>
              <span className="teacher-step-badge">2</span>
              <div>
                <h2>Nội dung câu hỏi</h2>
                <p>Mỗi câu có đúng 4 phương án và chỉ một đáp án đúng.</p>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Câu hỏi</label>
            <textarea
              required
              className="form-control"
              rows="3"
              value={form.questionText}
              onChange={(event) => setForm({ ...form, questionText: event.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Phương án trả lời</label>
            <div className="question-option-grid polished">
              {form.options.map((option, index) => (
                <label
                  className={`question-option-input${option.correct ? " correct" : ""}`}
                  key={option.id || index}
                >
                  <input
                    type="radio"
                    name="correct"
                    checked={option.correct}
                    onChange={() => updateOption(index, { correct: true })}
                  />
                  <span>{String.fromCharCode(65 + index)}</span>
                  <input
                    required
                    value={option.content}
                    onChange={(event) => updateOption(index, { content: event.target.value })}
                    placeholder={`Phương án ${String.fromCharCode(65 + index)}`}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <label className="form-label">Giải thích đáp án</label>
            <textarea
              className="form-control"
              rows="3"
              value={form.explanation}
              onChange={(event) => setForm({ ...form, explanation: event.target.value })}
              placeholder="Giải thích ngắn gọn vì sao đáp án đúng…"
            />
          </div>
        </section>

        <div className="teacher-editor-actions">
          <Link className="btn btn-outline-secondary" to={back.to}>
            Hủy
          </Link>
          <button className="btn btn-primary" disabled={state.saving || inUse}>
            {state.saving ? "Đang lưu…" : "Lưu câu hỏi"}
          </button>
        </div>
      </form>
    </main>
  );
}
