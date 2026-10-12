import { useEffect, useRef, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { enumLabel } from "../../utils/statusLabels";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import MaterialShell from "../../components/learning/MaterialShell";
import { quizApi } from "../../services/assessmentService";
import { apiError } from "../../utils/apiError";
import { quizFallback } from "../../utils/materialNavigation";
import { createAnswerSaver } from "../../utils/quizAnswers";

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export default function QuizTestPage() {
  const confirm = useConfirm();
  const { id } = useParams();
  const navigate = useNavigate();
  const started = useRef(null);
  const submitting = useRef(false);
  const saver = useRef(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [savedAnswers, setSavedAnswers] = useState({});
  const [pending, setPending] = useState([]);
  const [failed, setFailed] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [state, setState] = useState({ loading: true, submitting: false, error: "" });

  // Lượt làm bài không chứa lessonId; lấy thông tin quiz để biết đường về bài học.
  useEffect(() => {
    let active = true;
    quizApi
      .get(id)
      .then((data) => active && setQuiz(data))
      .catch(() => active && setQuiz(null));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (started.current?.id !== id) started.current = { id, promise: quizApi.start(id) };
    started.current.promise
      .then((data) => {
        if (!active) return;
        saver.current = createAnswerSaver((questionId, selectedAnswerId) =>
          quizApi.answer(data.attemptId, { questionId, selectedAnswerId }),
        );
        setAttempt(data);
        const restoredAnswers = data.savedAnswers || {};
        setAnswers(restoredAnswers);
        setSavedAnswers(restoredAnswers);
        setRemaining(
          Math.max(0, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 1000)),
        );
        setState((current) => ({ ...current, loading: false }));
      })
      .catch(
        (error) =>
          active &&
          setState((current) => ({
            ...current,
            loading: false,
            error: error.response?.data?.message || "Không thể bắt đầu bài kiểm tra",
            loadError: apiError(error, "Không thể bắt đầu bài kiểm tra"),
          })),
      );
    return () => {
      active = false;
    };
  }, [id]);

  async function finish(skipConfirmation = false) {
    if (!attempt || result || submitting.current) return;
    if (
      !skipConfirmation &&
      !(await confirm({
        message: `Nộp bài với ${Object.keys(answers).length}/${attempt.questions.length} câu đã trả lời?`,
        title: "Nộp bài",
        confirmLabel: "Nộp bài",
      }))
    )
      return;
    submitting.current = true;
    setState((current) => ({ ...current, submitting: true, error: "" }));
    try {
      const unsaved = await saver.current.flush();
      if (
        unsaved.length &&
        !skipConfirmation &&
        Date.now() < new Date(attempt.expiresAt).getTime()
      ) {
        throw new Error("Có đáp án chưa lưu. Hãy bấm Thử lưu lại trước khi nộp bài.");
      }
      const warning = unsaved.length
        ? `${unsaved.length} câu chưa lưu thành công khi hết giờ. Kết quả dựa trên đáp án máy chủ đã nhận.`
        : "";
      const submitted = await quizApi.submit(attempt.attemptId);
      setResult(submitted);
      // Kết quả có URL riêng: tải lại trang sẽ xem lại kết quả thay vì bắt đầu lượt mới.
      navigate(`/quiz/${id}/result/${submitted.id}`, {
        replace: true,
        state: warning ? { warning } : null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || error.message || "Không thể nộp bài",
      }));
    } finally {
      submitting.current = false;
      setState((current) => ({ ...current, submitting: false }));
    }
  }

  useEffect(() => {
    if (!attempt || result) return undefined;
    const timer = window.setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemaining(seconds);
      if (seconds === 0) {
        window.clearInterval(timer);
        finish(true);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result]);

  async function selectAnswer(questionId, selectedAnswerId) {
    if (submitting.current || result || Date.now() >= new Date(attempt.expiresAt).getTime()) return;
    setAnswers((current) => ({ ...current, [questionId]: selectedAnswerId }));
    const request = saver.current.save(questionId, selectedAnswerId);
    setPending(saver.current.pendingIds());
    setFailed(saver.current.failedIds());
    setState((current) => ({ ...current, error: "" }));
    try {
      await request;
      setSavedAnswers((current) => ({ ...current, [questionId]: selectedAnswerId }));
    } catch {
      // The failed question stays visible and can be retried before time runs out.
    } finally {
      setPending(saver.current.pendingIds());
      setFailed(saver.current.failedIds());
    }
  }

  if (state.loading || result) return <LoadingState />;
  if (state.error && !attempt)
    return (
      <main className="container py-5">
        <ErrorState
          error={state.loadError}
          actions={[
            quiz?.lessonId
              ? { label: "Về bài học", to: `/lessons/${quiz.lessonId}` }
              : { label: "Về bài kiểm tra", to: `/quiz/${id}` },
          ]}
        />
      </main>
    );
  return (
    <MaterialShell
      lessonId={quiz?.lessonId}
      type="QUIZ"
      materialId={attempt.quizId}
      title={attempt.quizTitle}
      fallback={quizFallback}
      showPager={false}
    >
      <main className="quiz-test-page">
        <header className="quiz-test-header">
          <div>
            <span>{attempt.quizTitle}</span>
            <small>
              {Object.keys(savedAnswers).length}/{attempt.questions.length} câu đã có đáp án được
              lưu
            </small>
          </div>
          <strong className={remaining < 60 ? "danger" : ""}>{formatTime(remaining)}</strong>
          <button
            className="btn btn-primary"
            disabled={state.submitting}
            onClick={() => finish(false)}
          >
            {state.submitting ? "Đang lưu và nộp…" : "Nộp bài"}
          </button>
        </header>
        <div className="container py-4 quiz-question-list">
          {attempt.autoSubmittedAttemptId && (
            <div className="alert alert-info">
              Lượt làm trước đã hết giờ và được tự nộp.{" "}
              <Link to={`/quiz/${id}/result/${attempt.autoSubmittedAttemptId}`}>Xem kết quả</Link>.
              Đây là lượt làm mới.
            </div>
          )}
          {state.error && <div className="alert alert-danger">{state.error}</div>}
          {attempt.questions.map((question, index) => (
            <article className="quiz-question-card" key={question.id}>
              <div className="d-flex justify-content-between gap-3">
                <span className="question-number">{index + 1}</span>
                <small>
                  {enumLabel(question.difficulty)}
                  {pending.includes(question.id)
                    ? " · Đang lưu…"
                    : failed.includes(question.id)
                      ? " · Chưa lưu lựa chọn mới"
                      : savedAnswers[question.id]
                        ? " · Đã lưu"
                        : ""}
                </small>
              </div>
              <h2>{question.questionText}</h2>
              <div className="quiz-options">
                {question.options.map((option, optionIndex) => (
                  <label
                    className={answers[question.id] === option.id ? "selected" : ""}
                    key={option.id}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[question.id] === option.id}
                      disabled={state.submitting || remaining === 0}
                      onChange={() => selectAnswer(question.id, option.id)}
                    />
                    <span>{String.fromCharCode(65 + optionIndex)}</span>
                    {option.content}
                  </label>
                ))}
              </div>
              {failed.includes(question.id) && (
                <div className="alert alert-warning mt-3">
                  Lựa chọn mới chưa lưu.{" "}
                  <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={state.submitting || remaining === 0}
                    onClick={() => selectAnswer(question.id, answers[question.id])}
                  >
                    Thử lưu lại
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </MaterialShell>
  );
}
