import AudioPlayer from "../../components/common/AudioPlayer";
import Icon from "../../components/common/Icon";
import { formatDateTime, formatNumber } from "../../utils/format";
import { useSuccessToast } from "../../components/common/Toast";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import MaterialShell from "../../components/learning/MaterialShell";
import { speakingApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";

function extensionForMime(type = "") {
  const mime = type.toLowerCase();
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  return "webm";
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SpeakingPage() {
  const { id } = useParams();
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const generationRef = useRef(0);
  const startingRef = useRef(false);
  const uploadingRef = useRef(false);
  const playerRef = useRef(null);
  const timerRef = useRef(null);

  const [starting, setStarting] = useState(false);
  const [data, setData] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audio, setAudio] = useState(null);
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const [state, setState] = useState({ error: "", message: "", working: false });
  useSuccessToast(state.message);

  useEffect(() => {
    generationRef.current += 1;
    let mounted = true;
    setData(null);
    setSubmission(null);
    setAudio(null);
    setRecording(false);
    setRecordingSeconds(0);
    setState({ error: "", message: "", working: false });

    Promise.all([speakingApi.studentGet(id), speakingApi.studentSubmission(id)])
      .then(([activity, submitted]) => {
        if (!mounted) return;
        setData(activity);
        setSubmission(submitted);
      })
      .catch(
        (e) =>
          mounted &&
          setState((s) => ({
            ...s,
            loadError: apiError(e, "Không thể tải bài Speaking"),
          })),
      );

    return () => {
      mounted = false;
      generationRef.current += 1;
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recorderRef.current) recorderRef.current.onstop = null;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      playerRef.current?.pause();
      if (playerRef.current) URL.revokeObjectURL(playerRef.current.src);
    };
  }, [id]);

  async function start() {
    if (startingRef.current || uploadingRef.current || recording) return;
    setState((s) => ({ ...s, error: "", message: "" }));
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState((s) => ({ ...s, error: "Trình duyệt này chưa hỗ trợ ghi âm trực tiếp." }));
      return;
    }
    const generation = generationRef.current;
    startingRef.current = true;
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        if (generation !== generationRef.current) return;
        const mimeType = recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const extension = extensionForMime(mimeType);
        setAudio(new File([blob], `speaking-${id}.${extension}`, { type: mimeType }));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (generation !== generationRef.current) return;
      setState((s) => ({
        ...s,
        error: "Không thể sử dụng micro. Hãy kiểm tra quyền truy cập micro trong trình duyệt.",
      }));
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function replay() {
    if (!audio) return;
    playerRef.current?.pause();
    if (playerRef.current) URL.revokeObjectURL(playerRef.current.src);
    const url = URL.createObjectURL(audio);
    const player = new Audio(url);
    playerRef.current = player;
    setIsPlayingLocal(true);

    player.onended = () => {
      setIsPlayingLocal(false);
      URL.revokeObjectURL(url);
    };
    player.onerror = () => {
      setIsPlayingLocal(false);
      URL.revokeObjectURL(url);
    };
    player.play().catch(() => {
      setIsPlayingLocal(false);
      URL.revokeObjectURL(url);
      setState((s) => ({ ...s, error: "Không thể phát bản ghi. Vui lòng thử lại." }));
    });
  }

  async function submit() {
    if (uploadingRef.current || startingRef.current || recording) return;
    if (!audio || audio.size === 0) {
      setState((s) => ({ ...s, error: "Bạn chưa ghi âm bài nói." }));
      return;
    }
    uploadingRef.current = true;
    setState((s) => ({ ...s, working: true, error: "", message: "" }));
    try {
      const saved = await speakingApi.submit(id, audio);
      setSubmission(saved);
      setAudio(null);
      setState((s) => ({
        ...s,
        working: false,
        message: "Đã nộp bài ghi âm thành công. Giáo viên sẽ nghe và chấm bài.",
      }));
    } catch (e) {
      const serverMessage = e.response?.data?.message;
      const networkMessage = !e.response
        ? "Không kết nối được với máy chủ khi nộp bài. Hãy kiểm tra backend đang chạy rồi thử lại."
        : "Không thể nộp bài ghi âm. Vui lòng thử lại.";
      setState((s) => ({ ...s, working: false, error: serverMessage || networkMessage }));
    } finally {
      uploadingRef.current = false;
    }
  }

  if (!data) {
    return (
      <main className="container py-5">
        {state.loadError ? (
          <ErrorState
            error={state.loadError}
            actions={[{ label: "Khóa học của tôi", to: "/courses" }]}
          />
        ) : (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" aria-label="Đang tải" />
          </div>
        )}
      </main>
    );
  }

  const graded = submission?.status === "GRADED";

  return (
    <MaterialShell
      lessonId={data.lessonId}
      type="SPEAKING"
      materialId={data.id}
      title={data.title}
      compact
      showPager={false}
    >
      <main className="container py-4 content-shell sp-container">
        {/* Đề bài & hướng dẫn */}
        <div className="ui-card p-4 mb-4">
          <div className="sp-header-row">
            <div>
              <h1 className="sp-title">{data.title}</h1>
            </div>
            {submission && (
              <span className={`sp-status-chip ${graded ? "is-graded" : "is-submitted"}`}>
                {graded ? "Đã chấm điểm" : "Đã nộp · Chờ chấm"}
              </span>
            )}
          </div>

          <div className="sp-instruction-box mt-3">
            <h2 className="sp-instruction-title">Đề bài & Yêu cầu:</h2>
            <p className="sp-instruction-text">{data.instruction}</p>
            {data.promptText && (
              <div className="sp-prompt-card mt-2">
                <strong>Gợi ý trả lời:</strong>
                <p className="m-0 mt-1">{data.promptText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Khối nhận xét & điểm số nếu giáo viên đã chấm */}
        {graded && (
          <section className="sp-graded-card mb-4">
            <div className="sp-graded-head">
              <div className="sp-score-badge">
                <span className="sp-score-label">Điểm đánh giá</span>
                <strong className="sp-score-value">
                  {formatNumber(submission.score || 0)}/100
                </strong>
              </div>
              <div className="sp-graded-meta">
                <Icon name="check" size={20} />
                <span>Giáo viên đã chấm bài</span>
                {submission.gradedAt && (
                  <small>Vào lúc {formatDateTime(submission.gradedAt)}</small>
                )}
              </div>
            </div>

            <div className="sp-feedback-box mt-3">
              <h3 className="sp-feedback-title">Nhận xét chi tiết từ giáo viên:</h3>
              <p className="sp-feedback-content">
                {submission.feedback?.trim() || "Giáo viên chưa để lại nhận xét."}
              </p>
            </div>

            <div className="mt-3">
              <span className="text-muted small d-block mb-1">Bản ghi âm đã nộp:</span>
              <AudioPlayer endpoint={`/speaking/submissions/${submission.id}/audio`} />
            </div>
          </section>
        )}

        {/* Bài đã nộp nhưng đang chờ chấm */}
        {submission && !graded && (
          <section className="sp-submitted-waiting-card mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Icon name="clock" size={18} />
                <strong>Bài đã nộp – Đang chờ giáo viên chấm</strong>
              </div>
              <time className="text-muted small">{formatDateTime(submission.submittedAt)}</time>
            </div>
            <AudioPlayer endpoint={`/speaking/submissions/${submission.id}/audio`} />
          </section>
        )}

        {/* Khung ghi âm nếu chưa nộp hoặc muốn nộp lại (chưa chấm) */}
        {!graded && (
          <section className="sp-recorder-card text-center p-4">
            <h2 className="sp-recorder-heading">
              {submission ? "Ghi âm bài nói mới (nộp lại)" : "Ghi âm bài nói của bạn"}
            </h2>

            {/* Trạng thái 1: Chưa ghi âm */}
            {!recording && !audio && (
              <div className="sp-record-state is-ready py-3">
                <button
                  type="button"
                  className="sp-mic-btn"
                  onClick={start}
                  disabled={state.working || starting}
                  title="Bắt đầu ghi âm"
                  aria-label="Bắt đầu ghi âm"
                >
                  <Icon name="mic" size={32} />
                </button>
                <span className="sp-mic-hint mt-2 d-block">
                  {starting ? "Đang kết nối micro…" : "Nhấn vào micro để bắt đầu"}
                </span>
              </div>
            )}

            {/* Trạng thái 2: Đang ghi âm */}
            {recording && (
              <div className="sp-record-state is-recording py-3">
                <div className="sp-recording-pulse">
                  <div className="sp-recording-wave" />
                  <span className="sp-recording-timer">{formatDuration(recordingSeconds)}</span>
                </div>
                <button type="button" className="btn btn-danger btn-lg mt-3" onClick={stop}>
                  <span className="me-2">■</span> Dừng ghi âm
                </button>
              </div>
            )}

            {/* Trạng thái 3: Đã ghi âm xong, sẵn sàng nghe lại & nộp */}
            {!recording && audio && (
              <div className="sp-record-state is-finished py-3">
                <div className="sp-audio-ready-badge mb-3">
                  <Icon name="check" size={16} />
                  <span>Bản ghi âm đã sẵn sàng ({formatDuration(recordingSeconds)})</span>
                </div>

                <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={replay}
                    disabled={isPlayingLocal}
                  >
                    <Icon name="audio" size={16} />
                    <span>{isPlayingLocal ? "Đang nghe…" : "Nghe lại bản ghi"}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={start}
                    disabled={state.working}
                  >
                    <Icon name="mic" size={16} />
                    <span>Ghi âm lại</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-lg px-4"
                  disabled={state.working || starting || recording}
                  onClick={submit}
                >
                  {state.working
                    ? "Đang tải lên & nộp…"
                    : submission
                      ? "Nộp lại bài này"
                      : "Nộp bài ghi âm"}
                </button>
              </div>
            )}

            {state.error && <div className="alert alert-danger mt-3">{state.error}</div>}
          </section>
        )}
      </main>
    </MaterialShell>
  );
}
