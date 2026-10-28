import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { finalTestApi } from "../../services/finalTestService";
import { getMediaBlob } from "../../services/mediaBlob";
import { useConfirm } from "../../components/common/ConfirmDialog";

const typeNames = {
  QUESTION: "Câu hỏi",
  QUESTION_SET: "Bộ câu hỏi",
  LISTENING: "Listening",
  READING: "Reading",
  SPEAKING: "Speaking",
};
const errorText = (e) => e.response?.data?.message || e.message || "Không thể tải Test";

export default function FinalTestPage() {
  const { id, attemptId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [info, setInfo] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrls, setMediaUrls] = useState({});
  const [recording, setRecording] = useState(false);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const submitLock = useRef(false);
  const ownedUrls = useRef([]);

  useEffect(() => {
    if (attemptId)
      finalTestApi
        .attempt(attemptId)
        .then(setAttempt)
        .catch((e) => setError(errorText(e)));
    else
      finalTestApi
        .studentInfo(id)
        .then(setInfo)
        .catch((e) => setError(errorText(e)));
  }, [id, attemptId]);
  useEffect(() => () => ownedUrls.current.forEach(URL.revokeObjectURL), []);
  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    const tick = () =>
      setRemaining(
        Math.max(0, Math.ceil((new Date(attempt.expires_at).getTime() - Date.now()) / 1000)),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attempt?.id, attempt?.status, attempt?.expires_at]);
  useEffect(() => {
    if (attempt?.status !== "IN_PROGRESS" || remaining !== 0 || submitLock.current) return;
    // Server is authoritative about expiry; this refresh also submits on expiry.
    finalTestApi
      .attempt(attempt.id)
      .then(setAttempt)
      .catch((e) => setError(errorText(e)));
  }, [remaining, attempt?.id, attempt?.status]);
  const parts = attempt?.sections || [];
  const section = parts[current];
  const answerCount = useMemo(
    () =>
      parts.reduce(
        (sum, part) =>
          sum +
          (part.answers || []).filter((a) => a.selected_option_id != null).length +
          (part.recording?.length || 0),
        0,
      ),
    [parts],
  );
  const questionCount = useMemo(
    () =>
      parts.reduce(
        (sum, part) => sum + (part.question_count || (part.source_type === "SPEAKING" ? 1 : 0)),
        0,
      ),
    [parts],
  );

  async function begin() {
    setBusy(true);
    setError("");
    try {
      const started = await finalTestApi.start(id);
      navigate(`/courses/${id}/test/attempts/${started.id}`, { replace: true });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function choose(part, questionKey, optionId) {
    if (attempt.status !== "IN_PROGRESS") return;
    setError("");
    try {
      await finalTestApi.answer(attempt.id, part.id, questionKey, optionId);
      setAttempt((old) => ({
        ...old,
        sections: old.sections.map((item) =>
          item.id === part.id
            ? {
                ...item,
                answers: [
                  ...item.answers.filter((answer) => answer.question_key !== questionKey),
                  { question_key: questionKey, selected_option_id: optionId },
                ],
              }
            : item,
        ),
      }));
    } catch (e) {
      setError(errorText(e));
    }
  }
  async function loadAudio(part, kind) {
    const key = `${kind}-${part.id}`;
    if (mediaUrls[key]) return;
    try {
      if (kind === "listening" && /^https?:\/\//.test(part.snapshot.audioUrl || "")) {
        setMediaUrls((old) => ({ ...old, [key]: part.snapshot.audioUrl }));
        return;
      }
      const url =
        kind === "recording"
          ? `/student/test/attempts/${attempt.id}/sections/${part.id}/recording`
          : `/student/test/attempts/${attempt.id}/sections/${part.id}/media?kind=audio`;
      const blob = await getMediaBlob(url, "audio");
      const objectUrl = URL.createObjectURL(blob);
      ownedUrls.current.push(objectUrl);
      setMediaUrls((old) => ({ ...old, [key]: objectUrl }));
    } catch (e) {
      setError(e.message);
    }
  }
  async function openAttachment(part, file, index) {
    const tab = window.open("", "_blank");
    try {
      const blob = await getMediaBlob(
        `/student/test/attempts/${attempt.id}/sections/${part.id}/media?kind=attachment&index=${index}`,
        file.mime_type === "application/pdf" ? "pdf" : "file",
      );
      const url = URL.createObjectURL(blob);
      ownedUrls.current.push(url);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (e) {
      tab?.close();
      setError(e.message);
    }
  }
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const instance = new MediaRecorder(stream);
      chunks.current = [];
      instance.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      instance.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunks.current, { type: instance.mimeType || "audio/webm" });
        if (!blob.size) return setError("Bản ghi âm trống. Vui lòng ghi lại.");
        try {
          const file = new File([blob], `test-speaking-${section.id}.webm`, { type: blob.type });
          await finalTestApi.recording(attempt.id, section.id, file);
          setAttempt(await finalTestApi.attempt(attempt.id));
          const objectUrl = URL.createObjectURL(blob);
          ownedUrls.current.push(objectUrl);
          setMediaUrls((old) => ({ ...old, [`recording-${section.id}`]: objectUrl }));
        } catch (e) {
          setError(errorText(e));
        }
      };
      recorder.current = instance;
      instance.start();
      setRecording(true);
    } catch (e) {
      setError("Không thể dùng micro. Hãy kiểm tra quyền truy cập và thử lại.");
    }
  }
  async function submit() {
    if (submitLock.current || recording) return;
    if (
      !(await confirm({
        title: "Nộp Test cuối khóa?",
        message: `Bạn đã trả lời ${answerCount}/${questionCount} câu hoặc phần. Sau khi nộp sẽ không thể sửa.`,
        confirmLabel: "Nộp bài",
      }))
    )
      return;
    submitLock.current = true;
    setBusy(true);
    setError("");
    try {
      setAttempt(await finalTestApi.submit(attempt.id));
    } catch (e) {
      submitLock.current = false;
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (error && !info && !attempt)
    return (
      <main className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <Link to={`/courses/${id}`}>Về khóa học</Link>
      </main>
    );
  if (!attemptId)
    return (
      <main className="container py-4 final-test-intro">
        <Link to={`/courses/${id}`}>← Về khóa học</Link>
        {!info ? (
          <p>Đang tải Test…</p>
        ) : !info.exists ? (
          <p>Khóa học chưa có Test cuối khóa.</p>
        ) : (
          <section className="card p-4 mt-3">
            <h1 className="h3">{info.title}</h1>
            <p>
              {info.timeLimitMinutes} phút · {info.totalPoints} điểm
            </p>
            {info.attempt?.id && (
              <Link
                className="btn btn-primary align-self-start"
                to={`/courses/${id}/test/attempts/${info.attempt.id}`}
              >
                {info.attempt.status === "IN_PROGRESS" ? "Tiếp tục Test" : "Xem kết quả"}
              </Link>
            )}
            {!info.attempt?.id &&
              (info.eligible ? (
                <button
                  className="btn btn-primary align-self-start"
                  disabled={busy}
                  onClick={begin}
                >
                  Bắt đầu Test
                </button>
              ) : (
                <p>Hoàn thành các bài học và tham gia lớp của khóa để mở Test.</p>
              ))}
          </section>
        )}
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </main>
    );
  if (!attempt) return <main className="container py-4">Đang tải bài làm…</main>;
  if (attempt.status !== "IN_PROGRESS")
    return (
      <main className="container py-4 final-test-result">
        <Link to={`/courses/${attempt.course_id}`}>← Về khóa học</Link>
        <h1 className="h2 mt-3">Kết quả Test cuối khóa</h1>
        <p>
          {attempt.status === "PENDING_GRADING"
            ? "Chờ giáo viên chấm Speaking"
            : `${attempt.earned_points}/${attempt.total_points} điểm · ${attempt.passed ? "Đạt" : "Chưa đạt"}`}
        </p>
        <div className="d-grid gap-2">
          {parts.map((part) => (
            <article className="card p-3" key={part.id}>
              <h2 className="h5">{part.title}</h2>
              <p className="mb-0">
                {part.score?.length
                  ? `${part.score[0].earned_points}/${part.max_points} điểm`
                  : "Chờ chấm"}
              </p>
              {part.score?.[0]?.feedback && <p className="mt-2 mb-0">{part.score[0].feedback}</p>}
              {part.source_type === "SPEAKING" && part.recording?.length > 0 && (
                <div className="mt-2">
                  <button className="btn btn-link p-0" onClick={() => loadAudio(part, "recording")}>
                    Nghe lại bản ghi
                  </button>
                  {mediaUrls[`recording-${part.id}`] && (
                    <audio
                      className="d-block w-100 mt-2"
                      controls
                      src={mediaUrls[`recording-${part.id}`]}
                    />
                  )}
                </div>
              )}
              {part.snapshot?.questions?.length > 0 && (
                <details className="mt-3">
                  <summary>Xem lại câu trả lời</summary>
                  <div className="d-grid gap-3 mt-3">
                    {part.snapshot.questions.map((question, index) => {
                      const selected = part.answers?.find(
                        (answer) => answer.question_key === String(question.key),
                      )?.selected_option_id;
                      return (
                        <div key={question.key} className="final-test-review-question">
                          <strong>
                            {index + 1}. {question.text}
                          </strong>
                          <div className="mt-2">
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className={
                                  option.correct
                                    ? "text-success"
                                    : String(option.id) === String(selected)
                                      ? "text-danger"
                                      : ""
                                }
                              >
                                {option.correct
                                  ? "✓ "
                                  : String(option.id) === String(selected)
                                    ? "● "
                                    : ""}
                                {option.text}
                                {String(option.id) === String(selected) ? " · Bạn chọn" : ""}
                              </div>
                            ))}
                          </div>
                          {question.explanation && (
                            <p className="text-muted mt-2 mb-0">{question.explanation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </article>
          ))}
        </div>
      </main>
    );
  const currentAnswer = (part, key) =>
    part.answers?.find((item) => item.question_key === String(key))?.selected_option_id;
  return (
    <main className="container py-3 final-test-work">
      <header className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <strong>{attempt.title}</strong>
        <span aria-live="polite">
          {remaining == null
            ? "--:--"
            : `${Math.floor(remaining / 60)
                .toString()
                .padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`}
        </span>
      </header>
      <div className="d-flex justify-content-between text-muted mb-3">
        <span>
          Phần {current + 1}/{parts.length}
        </span>
        <span>
          Đã trả lời {answerCount}/{questionCount}
        </span>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <section className="card p-3 p-md-4 mb-3" key={section?.id}>
        <h1 className="h4">{section.title}</h1>
        <p className="text-muted">
          {typeNames[section.source_type]} · {section.max_points} điểm
        </p>
        {section.snapshot.instruction && <p>{section.snapshot.instruction}</p>}
        {section.snapshot.audioUrl && (
          <div className="mb-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => loadAudio(section, "listening")}
            >
              Phát file nghe
            </button>
            {mediaUrls[`listening-${section.id}`] && (
              <audio
                className="d-block mt-2 w-100"
                controls
                src={mediaUrls[`listening-${section.id}`]}
              />
            )}
          </div>
        )}
        {section.snapshot.passage && (
          <div className="final-test-passage mb-3">{section.snapshot.passage}</div>
        )}
        {section.snapshot.attachments?.map((file, index) => (
          <p key={file.id}>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => openAttachment(section, file, index)}
            >
              {file.title}
            </button>
          </p>
        ))}
        {section.source_type === "SPEAKING" ? (
          <div>
            <p>{section.snapshot.prompt}</p>
            <button
              className={`btn ${recording ? "btn-danger" : "btn-primary"}`}
              onClick={() => (recording ? recorder.current?.stop() : startRecording())}
            >
              {recording ? "Dừng ghi âm" : "Ghi âm"}
            </button>
            {section.recording?.length > 0 && (
              <div className="mt-3">
                <span>Đã lưu bản ghi âm</span>
                <button className="btn btn-link" onClick={() => loadAudio(section, "recording")}>
                  Nghe lại
                </button>
                {mediaUrls[`recording-${section.id}`] && (
                  <audio
                    className="d-block w-100"
                    controls
                    src={mediaUrls[`recording-${section.id}`]}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="d-grid gap-4">
            {section.snapshot.questions.map((question, index) => (
              <div key={question.key}>
                {question.passage &&
                  question.passage !== section.snapshot.questions[index - 1]?.passage && (
                    <div className="final-test-passage mb-3">{question.passage}</div>
                  )}
                <h2 className="h5">
                  {index + 1}. {question.text}
                </h2>
                <div className="d-grid gap-2">
                  {question.options.map((option) => (
                    <button
                      type="button"
                      className={`btn text-start ${String(currentAnswer(section, question.key)) === String(option.id) ? "btn-primary" : "btn-outline-secondary"}`}
                      key={option.id}
                      onClick={() => choose(section, String(question.key), option.id)}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <nav className="d-flex flex-wrap justify-content-between gap-2">
        <button
          className="btn btn-outline-secondary"
          disabled={current === 0}
          onClick={() => setCurrent((v) => v - 1)}
        >
          Phần trước
        </button>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            disabled={current === parts.length - 1}
            onClick={() => setCurrent((v) => v + 1)}
          >
            Phần tiếp
          </button>
          <button className="btn btn-outline-primary" disabled={busy || recording} onClick={submit}>
            Nộp Test
          </button>
        </div>
      </nav>
    </main>
  );
}
