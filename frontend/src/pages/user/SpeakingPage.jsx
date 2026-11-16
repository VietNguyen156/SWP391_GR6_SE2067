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

export default function SpeakingPage() {
  const { id } = useParams();
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const generationRef = useRef(0);
  const startingRef = useRef(false);
  const uploadingRef = useRef(false);
  const playerRef = useRef(null);
  const [starting, setStarting] = useState(false);
  const [data, setData] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState(null);
  const [state, setState] = useState({ error: "", message: "", working: false });
  useSuccessToast(state.message);

  useEffect(() => {
    generationRef.current += 1;
    let mounted = true;
    setData(null);
    setSubmission(null);
    setAudio(null);
    setRecording(false);
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
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (generation !== generationRef.current) return;
      setState((s) => ({
        ...s,
        error: "Không thể sử dụng micro. Hãy kiểm tra quyền micro của trình duyệt.",
      }));
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function replay() {
    if (!audio) return;
    playerRef.current?.pause();
    if (playerRef.current) URL.revokeObjectURL(playerRef.current.src);
    const url = URL.createObjectURL(audio);
    const player = new Audio(url);
    playerRef.current = player;
    player.onended = () => URL.revokeObjectURL(url);
    player.onerror = () => URL.revokeObjectURL(url);
    player.play().catch(() => {
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
        message: "Đã nộp bài ghi âm. Giáo viên sẽ nghe và chấm bài.",
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
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" aria-label="Đang tải" />
          </div>
        )}
      </main>
    );
  }

  const graded = submission?.status === "GRADED";

  return (
    <MaterialShell lessonId={data.lessonId} type="SPEAKING" materialId={data.id} title={data.title}>
      <main className="container py-4 content-shell">
        <div className="teacher-panel p-4">
          <div className="student-speaking-title-row">
            <h1>{data.title}</h1>
            {submission && (
              <span className={`student-speaking-state ${graded ? "graded" : "submitted"}`}>
                {graded ? "Đã chấm" : "Đã nộp · Chờ chấm"}
              </span>
            )}
          </div>
          <h2 className="h6 mt-4">Yêu cầu</h2>
          <p>{data.instruction}</p>
          {data.promptText && <div className="alert alert-light">{data.promptText}</div>}

          {submission && (
            <section className={`student-speaking-submission ${graded ? "graded" : "submitted"}`}>
              <div className="student-speaking-submission-head">
                <div>
                  <span>Trạng thái</span>
                  <strong>{graded ? "Đã chấm" : "Đã nộp – Chờ giáo viên chấm"}</strong>
                  <small>Nộp lúc {formatDateTime(submission.submittedAt)}</small>
                </div>
                {graded && (
                  <div className="student-speaking-score">
                    <span>Điểm</span>
                    <strong>{formatNumber(submission.score || 0)}/100</strong>
                  </div>
                )}
              </div>
              <AudioPlayer
                endpoint={`/speaking/submissions/${submission.id}/audio`}
                className="student-speaking-audio"
              />
              {graded && (
                <div className="student-speaking-feedback">
                  <span>Nhận xét của giáo viên</span>
                  <p>{submission.feedback?.trim() || "Giáo viên chưa để lại nhận xét."}</p>
                  {submission.gradedAt && (
                    <small>Chấm lúc {formatDateTime(submission.gradedAt)}</small>
                  )}
                </div>
              )}
            </section>
          )}

          {!graded && (
            <>
              <div className="d-flex gap-2 mt-4 flex-wrap">
                {!recording ? (
                  <button
                    className="btn btn-primary"
                    onClick={start}
                    disabled={state.working || starting}
                  >
                    <Icon name="mic" size={18} />
                    {starting ? "Đang mở micro…" : submission ? "Ghi âm bài mới" : "Bắt đầu ghi âm"}
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={stop}>
                    Dừng ghi âm
                  </button>
                )}
                {audio && (
                  <button className="btn btn-outline-primary" onClick={replay}>
                    Nghe bản ghi mới
                  </button>
                )}
              </div>

              {audio && !recording && (
                <div className="small text-secondary mt-2">
                  Bản ghi mới đã sẵn sàng để {submission ? "nộp lại" : "nộp"}.
                </div>
              )}

              <button
                className="btn btn-success mt-4"
                disabled={state.working || starting || recording || !audio}
                onClick={submit}
              >
                {state.working ? "Đang nộp…" : submission ? "Nộp lại bài" : "Nộp bài ghi âm"}
              </button>
            </>
          )}
          {graded && (
            <div className="alert alert-info mt-4 mb-0">
              Bài đã được giáo viên chấm nên kết quả được khóa và không thể nộp lại.
            </div>
          )}
          {state.error && <div className="alert alert-danger mt-3">{state.error}</div>}
        </div>
      </main>
    </MaterialShell>
  );
}
