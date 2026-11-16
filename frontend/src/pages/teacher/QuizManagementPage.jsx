import { quizKindLabel } from "../../utils/statusLabels";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import IconButton from "../../components/common/IconButton";
import { quizApi } from "../../services/assessmentService";

export default function QuizManagementPage() {
  const confirm = useConfirm();
  const [quizzes, setQuizzes] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  async function load() {
    try {
      setQuizzes(await quizApi.teacherList());
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({
        loading: false,
        error: error.response?.data?.message || "Không thể tải danh sách bài kiểm tra",
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (
      !(await confirm({
        message:
          "Xóa bài kiểm tra này? Các lượt làm đã có sẽ được bảo toàn theo quy tắc của máy chủ.",
        title: "Xóa quiz",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await quizApi.remove(id);
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Không thể xóa bài kiểm tra",
      }));
    }
  }

  return (
    <main className="container py-5 content-shell">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-0">Quản lý bài kiểm tra</h1>
        </div>
        <Link className="btn btn-primary" to="/teacher/quizzes/create">
          + Tạo đề thi thử
        </Link>
      </div>
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      {state.loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <div className="content-grid">
          {quizzes.map((quiz) => (
            <article className="assessment-quiz-card" key={quiz.id}>
              <div className="d-flex justify-content-between gap-3 align-items-start">
                <span className="badge text-bg-light">{quizKindLabel(quiz)}</span>
              </div>
              <h2>{quiz.title}</h2>
              <p className="line-clamp-3">{quiz.description || "Chưa có mô tả."}</p>
              <div className="assessment-meta">
                <span>{quiz.totalQuestion} câu</span>
                <span>{quiz.timeLimitMinutes} phút</span>
                {quiz.courseTitle && <span>{quiz.courseTitle}</span>}
                {quiz.lessonTitle && <span>Bài: {quiz.lessonTitle}</span>}
              </div>
              <div className="d-flex gap-2 mt-4">
                <IconButton icon="edit" label="Sửa" to={`/teacher/quizzes/${quiz.id}/edit`} />
                <IconButton
                  icon="trash"
                  label="Xóa"
                  tone="danger"
                  onClick={() => remove(quiz.id)}
                  disabled={quiz.inUse}
                  disabledReason="Quiz đã có lượt làm nên không thể xóa."
                />
              </div>
            </article>
          ))}
          {!quizzes.length && (
            <div className="content-empty">
              Chưa có bài kiểm tra. Hãy tạo câu hỏi trước, sau đó ghép chúng thành một bài kiểm tra.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
