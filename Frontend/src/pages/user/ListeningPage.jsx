import AudioPlayer from "../../components/common/AudioPlayer";
import Icon from "../../components/common/Icon";
import LoadingState from "../../components/common/LoadingState";
import { formatDateTime, formatPercent } from "../../utils/format";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import MaterialShell from "../../components/learning/MaterialShell";
import QuestionCard, { answeredWrong } from "../../components/learning/QuestionCard";
import { listeningApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";
import { LISTENING_SKILL_LABELS } from "../../utils/listeningSkills";

function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Trang làm Listening. Lượt chính thức chỉ có một lần; sau đó học viên xem phân tích theo kỹ năng,
 * transcript, đoạn chứa đáp án (nghe lại đúng đoạn) và luyện thêm theo kỹ năng yếu. Mọi lượt làm
 * được lưu trong lịch sử.
 */
export default function ListeningPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const practiceSkill = searchParams.get("practiceSkill");
  const isNewPracticeAttempt = searchParams.get("new") === "1";
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const audioControl = useRef(null);

  function loadHistory() {
    const request = practiceSkill
      ? listeningApi.practiceHistory(id, practiceSkill)
      : listeningApi.history(id);
    request.then((rows) => setHistory(rows || [])).catch(() => setHistory([]));
  }

  useEffect(() => {
    let active = true;
    setData(null);
    setAnswers({});
    setResult(null);
    setHistory([]);
    setError("");
    setLoadError(null);
    const activityRequest = practiceSkill
      ? listeningApi.practiceGet(id, practiceSkill)
      : listeningApi.studentGet(id);
    const resultRequest = practiceSkill
      ? isNewPracticeAttempt
        ? Promise.resolve(null)
        : listeningApi.practiceResult(id, practiceSkill)
      : listeningApi.result(id);
    const historyRequest = practiceSkill
      ? listeningApi.practiceHistory(id, practiceSkill)
      : listeningApi.history(id);
    Promise.all([activityRequest, resultRequest, historyRequest.catch(() => [])])
      .then(([activity, previous, attempts]) => {
        if (!active) return;
        setData(activity);
        setHistory(attempts || []);
        if (previous) {
          setResult(previous);
          setAnswers(previous.answers || {});
        }
      })
      .catch((e) => active && setLoadError(apiError(e, "Không thể tải bài nghe")));
    return () => {
      active = false;
    };
  }, [id, practiceSkill, isNewPracticeAttempt]);

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
      const saved = practiceSkill
        ? await listeningApi.practiceSubmit(id, practiceSkill, answers)
        : await listeningApi.submit(id, answers);
      setResult(saved);
      setAnswers(saved.answers || answers);
      if (practiceSkill) setSearchParams({ practiceSkill }, { replace: true });
      loadHistory();
    } catch (e) {
      // 409: lượt chính thức đã được lưu bởi yêu cầu nộp trước (bấm đúp / hai tab) → hiện kết quả đã lưu.
      if (!practiceSkill && e.response?.status === 409) {
        try {
          const saved = await listeningApi.result(id);
          if (saved) {
            setResult(saved);
            setAnswers(saved.answers || {});
            loadHistory();
            return;
          }
        } catch {
          /* hiện lỗi bên dưới */
        }
      }
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
  const isAssessment = result && result.attemptType !== "TARGETED_PRACTICE";
  const skillEntries = Object.entries(result?.skillAnalysis || {});

  return (
    <MaterialShell
      lessonId={data.lessonId}
      type="LISTENING"
      materialId={data.id}
      title={data.title}
      compact
      showPager={Boolean(result)}
    >
      <main className="container student-activity-shell">
        <section className="student-activity-hero listening-hero">
          <div>
            <h1>{data.title}</h1>
            <p>{data.instruction || data.description}</p>
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
              <strong>
                {isAssessment
                  ? "Bài đã được nộp và lưu kết quả"
                  : `Kết quả luyện: ${LISTENING_SKILL_LABELS[result.skillType] || result.skillType}`}
              </strong>
              <span>
                {isAssessment
                  ? "Lượt chính thức chỉ làm một lần. Bạn có thể luyện thêm theo kỹ năng bên dưới."
                  : "Bài luyện không thay đổi điểm chính thức; bạn có thể làm nhiều lượt."}
              </span>
            </div>
            {result.submittedAt && <time>{formatDateTime(result.submittedAt)}</time>}
          </section>
        )}

        {isAssessment && (
          <section className="student-result-banner" aria-label="Phân tích theo kỹ năng">
            <div className="student-result-icon">
              <Icon name="audio" size={20} />
            </div>
            <div className="w-100">
              <strong>Phân tích theo kỹ năng nghe</strong>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {skillEntries.map(([skill, analysis]) => (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    key={skill}
                    type="button"
                    onClick={() => setSearchParams({ practiceSkill: skill })}
                  >
                    {LISTENING_SKILL_LABELS[skill] || skill}: {analysis.correct}/{analysis.total}{" "}
                    đúng · {formatPercent(analysis.score)}
                    {analysis.score < 70 ? " · Ưu tiên luyện" : " · Đã khá"}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {practiceSkill && (
          <section className="student-result-banner">
            <div>
              <strong>
                Luyện mục tiêu: {LISTENING_SKILL_LABELS[practiceSkill] || practiceSkill}
              </strong>
              <span>
                Bài luyện chỉ lấy các câu thuộc kỹ năng này trong bài nghe. Điểm được lưu riêng cho
                từng lượt.
              </span>
              {result?.attemptType === "TARGETED_PRACTICE" && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setSearchParams({ practiceSkill, new: "1" })}
                  >
                    Luyện lại kỹ năng này
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSearchParams({})}
                  >
                    Về kết quả chính thức
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="student-audio-card">
          <div>
            <span>Audio bài nghe</span>
          </div>
          {data.audioUrl ? (
            <AudioPlayer
              controlRef={audioControl}
              endpoint={`/media/listening?url=${encodeURIComponent(data.audioUrl)}`}
            />
          ) : (
            <div className="alert alert-warning mb-0">Bài này chưa có file âm thanh.</div>
          )}
        </section>

        {isAssessment && result.transcript && (
          <section className="student-transcript-card mb-4">
            <div className="student-transcript-header">
              <div className="d-flex align-items-center gap-2">
                <Icon name="audio" size={18} />
                <h3 className="m-0 fs-6 fw-bold">Nội dung bài nghe (Transcript)</h3>
              </div>
              <span className="badge-transcript">Đã nộp bài</span>
            </div>
            <div className="student-transcript-body">
              <p className="m-0 text-muted lh-base" style={{ whiteSpace: "pre-wrap" }}>
                {result.transcript}
              </p>
            </div>
          </section>
        )}

        <section className="student-question-stack">
          {data.questions.map((question, index) => {
            const review = result?.reviews?.[question.id];
            const wrong = answeredWrong(question, answers[question.id], result);
            const hasWindow = review?.audioStartSec != null && data.audioUrl;
            return (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                answer={answers[question.id]}
                result={result}
                disabled={submitting}
                onPick={(optionId) =>
                  setAnswers((current) => ({ ...current, [question.id]: optionId }))
                }
              >
                {question.skillType && (
                  <div className="text-primary small fw-semibold mt-2">
                    Kỹ năng: {LISTENING_SKILL_LABELS[question.skillType] || question.skillType}
                  </div>
                )}
                {result && review && (
                  <div className="rp-feedback">
                    {wrong && review.explanation && (
                      <p className="rp-explain">
                        <strong>Giải thích:</strong> {review.explanation}
                      </p>
                    )}
                    {review.transcriptExcerpt && (
                      <p className="rp-explain">
                        <strong>Đoạn chứa đáp án:</strong> “{review.transcriptExcerpt}”
                      </p>
                    )}
                    {hasWindow && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          audioControl.current?.seekTo(review.audioStartSec, review.audioEndSec)
                        }
                      >
                        Nghe lại đoạn này ({formatClock(review.audioStartSec)}
                        {review.audioEndSec != null ? `–${formatClock(review.audioEndSec)}` : ""})
                      </button>
                    )}
                  </div>
                )}
              </QuestionCard>
            );
          })}
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

        {history.length > 0 && (
          <section className="student-transcript-card mt-4" aria-label="Lịch sử làm bài">
            <div className="student-transcript-header">
              <h3 className="m-0 fs-6 fw-bold">Lịch sử các lần làm</h3>
            </div>
            <div className="student-transcript-body">
              <ul className="list-unstyled m-0">
                {history.map((attempt, index) => (
                  <li className="d-flex flex-wrap justify-content-between gap-2 py-1" key={attempt.attemptId}>
                    <span>
                      Lần {history.length - index} ·{" "}
                      {attempt.attemptType === "ASSESSMENT"
                        ? "Chính thức"
                        : `Luyện ${LISTENING_SKILL_LABELS[attempt.skillType] || attempt.skillType}`}
                    </span>
                    <span>
                      {attempt.correct}/{attempt.total} đúng · {formatPercent(attempt.score)} ·{" "}
                      {formatDateTime(attempt.submittedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </MaterialShell>
  );
}
