import AudioPlayer from "../../components/common/AudioPlayer";
import Icon from "../../components/common/Icon";
import LoadingState from "../../components/common/LoadingState";
import { formatDateTime, formatPercent } from "../../utils/format";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import MaterialShell from "../../components/learning/MaterialShell";
import TranscriptPanel from "../../components/learning/TranscriptPanel";
import { listeningApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";

export default function ListeningPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    let active = true;
    setData(null);
    setAnswers({});
    setResult(null);
    setError("");
    setLoadError(null);
    Promise.all([listeningApi.studentGet(id), listeningApi.result(id)])
      .then(([activity, previous]) => {
        if (!active) return;
        setData(activity);
        if (previous) {
          setResult(previous);
          setAnswers(previous.answers || {});
        }
      })
      .catch((e) => active && setLoadError(apiError(e, "Không thể tải bài nghe")));
    return () => {
      active = false;
    };
  }, [id]);

  async function submit() {
    if (submitLock.current || result) return;
    const unanswered = (data?.questions || []).filter((question) => !answers[question.id]);
    if (unanswered.length) {
      setError(`Bạn còn ${unanswered.length} câu chưa chọn đáp án.`);
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const saved = await listeningApi.submit(id, answers);
      setResult(saved);
      setAnswers(saved.answers || answers);
    } catch (e) {
      setError(e.response?.data?.message || "Không thể nộp bài");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (loadError)
    return (
      <main className="container py-5">
        <ErrorState error={loadError} actions={[{ label: "Khóa học của tôi", to: "/courses" }]} />
      </main>
    );
  if (!data) return <LoadingState />;

  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <MaterialShell
      lessonId={data.lessonId}
      type="LISTENING"
      materialId={data.id}
      title={data.title}
    >
      <main className="container student-activity-shell">
        <section className="student-activity-hero listening-hero">
          <div>
            <h1>{data.title}</h1>
            <p>
              {data.instruction ||
                data.description ||
                "Nghe audio và chọn đáp án phù hợp cho từng câu hỏi."}
            </p>
          </div>
          <div className="student-activity-progress">
            <span>{result ? "KẾT QUẢ" : "TIẾN ĐỘ"}</span>
            <strong>
              {result
                ? `${formatPercent(result.score || 0)}`
                : `${answeredCount}/${data.questions.length}`}
            </strong>
            <small>
              {result ? `${result.correct}/${result.total} câu đúng` : "câu đã trả lời"}
            </small>
          </div>
        </section>

        {result && (
          <section className="student-result-banner">
            <div className="student-result-icon">
              <Icon name="check" size={20} />
            </div>
            <div>
              <strong>Bài đã được nộp và lưu kết quả</strong>
              <span>Bạn không cần làm lại khi mở bài lần sau.</span>
            </div>
            {result.submittedAt && <time>{formatDateTime(result.submittedAt)}</time>}
          </section>
        )}

        <section className="student-audio-card">
          <div>
            <span>Audio bài nghe</span>
            <small>Nghe kỹ trước khi trả lời. Bạn có thể phát lại khi cần.</small>
          </div>
          {data.audioUrl ? (
            <AudioPlayer endpoint={`/media/listening?url=${encodeURIComponent(data.audioUrl)}`} />
          ) : (
            <div className="alert alert-warning mb-0">Bài này chưa có file âm thanh.</div>
          )}
        </section>

        {result?.transcript && <TranscriptPanel transcript={result.transcript} />}

        <section className="student-question-stack">
          {data.questions.map((question, index) => (
            <article
              className={`student-question-card ${result ? "is-submitted" : ""}`}
              key={question.id}
            >
              <header>
                <span>Câu {index + 1}</span>
                <h2>{question.questionText}</h2>
              </header>
              <div className="student-option-grid">
                {question.options.map((option, optionIndex) => {
                  const checked = Number(answers[question.id]) === Number(option.id);
                  return (
                    <label
                      className={`student-option ${checked ? "selected" : ""} ${result && checked ? "locked-selection" : ""}`}
                      key={option.id}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={checked}
                        disabled={submitting || Boolean(result)}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.id]: option.id }))
                        }
                      />
                      <span className="student-option-key">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option.optionText}</span>
                      {result && checked && <b>Đã chọn</b>}
                    </label>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        {error && <div className="alert alert-danger mt-3">{error}</div>}
        <div className="student-submit-bar">
          <div>
            <span>
              {result
                ? "Bài đã hoàn tất"
                : `${answeredCount}/${data.questions.length} câu đã trả lời`}
            </span>
            <small>
              {result ? "Kết quả đã được lưu trong hệ thống." : "Kiểm tra đáp án trước khi nộp."}
            </small>
          </div>
          {!result && (
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>
              {submitting ? "Đang nộp…" : "Nộp bài"}
            </button>
          )}
        </div>
      </main>
    </MaterialShell>
  );
}
