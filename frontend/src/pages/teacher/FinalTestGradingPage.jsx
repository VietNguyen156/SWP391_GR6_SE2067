import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { statusLabel } from "../../utils/statusLabels";
import { finalTestApi } from "../../services/finalTestService";
import { getMediaBlob } from "../../services/mediaBlob";

export default function FinalTestGradingPage() {
  const { id, attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [audio, setAudio] = useState({});
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState({});
  const load = () =>
    finalTestApi
      .teacherAttempt(id, attemptId)
      .then(setAttempt)
      .catch((e) => setError(e.response?.data?.message || e.message));
  useEffect(() => {
    load();
    return () => Object.values(audio).forEach(URL.revokeObjectURL);
  }, [id, attemptId]);
  async function play(sectionId) {
    try {
      const blob = await getMediaBlob(
        `/teacher/test/attempts/${attemptId}/sections/${sectionId}/recording`,
        "audio",
      );
      const url = URL.createObjectURL(blob);
      setAudio((current) => ({ ...current, [sectionId]: url }));
    } catch (e) {
      setError(e.message);
    }
  }
  async function grade(section) {
    const value = drafts[section.id] || {};
    const score = value.score ?? section.score[0]?.earned_points;
    if (score === undefined || score === "" || score === null) {
      setError("Nhập điểm Speaking trước khi lưu.");
      return;
    }
    setError("");
    setSaving(section.id);
    try {
      await finalTestApi.grade(
        id,
        attemptId,
        section.id,
        Number(score),
        value.feedback ?? section.score[0]?.feedback ?? "",
      );
      await load();
      // Ô nhập hiển thị lại giá trị đã lưu trên máy chủ; chỉ báo "đã lưu" khi chưa sửa tiếp.
      setDrafts((current) => {
        const next = { ...current };
        delete next[section.id];
        return next;
      });
      setSaved((current) => ({ ...current, [section.id]: true }));
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSaving(null);
    }
  }
  if (!attempt) return <main className="container py-4">{error || "Đang tải lượt làm…"}</main>;
  return (
    <main className="container py-4">
      <Link to={`/teacher/courses/${id}/test`}>← Về Test cuối khóa</Link>
      <h1 className="h2 mt-3">Chấm lượt làm #{attemptId}</h1>
      <p>
        Trạng thái: {statusLabel(attempt.status)} · Điểm: {attempt.earned_points ?? "Chờ chấm"}/
        {attempt.total_points}
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="d-grid gap-3">
        {attempt.sections.map((section) => (
          <section className="card p-3" key={section.id}>
            <h2 className="h5">
              {section.title} · {section.source_type} · {section.max_points} điểm
              {section.source_type === "SPEAKING" && (
                <span
                  className={`badge ms-2 ${section.score[0] ? "text-bg-success" : "text-bg-warning"}`}
                >
                  {section.score[0] ? "Đã chấm" : "Chờ chấm"}
                </span>
              )}
            </h2>
            {section.source_type === "SPEAKING" ? (
              <>
                <p>{section.snapshot.prompt || section.snapshot.instruction}</p>
                {section.recording.length ? (
                  <>
                    <button
                      className="btn btn-outline-primary align-self-start"
                      onClick={() => play(section.id)}
                    >
                      Nghe bản ghi
                    </button>
                    {audio[section.id] && <audio controls src={audio[section.id]} />}
                  </>
                ) : (
                  <p>Học viên chưa tải bản ghi âm.</p>
                )}
                <div className="row g-2">
                  <label className="col-md-3">
                    Điểm (0–{section.max_points})
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      max={section.max_points}
                      step="0.01"
                      value={drafts[section.id]?.score ?? section.score[0]?.earned_points ?? ""}
                      onChange={(e) =>
                        setDrafts((v) => ({
                          ...v,
                          [section.id]: { ...v[section.id], score: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="col-md-9">
                    Nhận xét
                    <textarea
                      className="form-control"
                      value={drafts[section.id]?.feedback ?? section.score[0]?.feedback ?? ""}
                      onChange={(e) =>
                        setDrafts((v) => ({
                          ...v,
                          [section.id]: { ...v[section.id], feedback: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <button
                    className="btn btn-primary"
                    disabled={saving === section.id}
                    onClick={() => grade(section)}
                  >
                    {saving === section.id ? "Đang lưu…" : "Lưu điểm Speaking"}
                  </button>
                  {saved[section.id] && !drafts[section.id] && (
                    <span className="text-success fw-semibold">✓ Đã lưu điểm</span>
                  )}
                </div>
              </>
            ) : (
              <p>
                Đã chấm tự động: {section.score[0]?.earned_points ?? 0}/{section.max_points} điểm
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
