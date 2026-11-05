import AudioPlayer from "../../components/common/AudioPlayer";
import LoadingState from "../../components/common/LoadingState";
import { formatDateTime, formatNumber } from "../../utils/format";
import { useSuccessToast } from "../../components/common/Toast";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { classroomApi } from "../../services/classroomService";
import { speakingApi } from "../../services/learningContentService";
import { classStatusLabel, statusLabel } from "../../utils/statusLabels";

const typeLabel = (type) =>
  ({ SPEAKING: "Speaking", LISTENING: "Listening", READING: "Reading" })[type] || type;
const submissionStatus = (status) =>
  ({ SUBMITTED: "Đã nộp", GRADED: "Đã chấm", AUTO_SUBMITTED: "Đã nộp tự động" })[status] ||
  statusLabel(status);

const RUBRIC_ITEMS = [
  ["taskCompletionScore", "taskCompletionFeedback", "Hoàn thành yêu cầu", 30],
  ["fluencyScore", "fluencyFeedback", "Độ lưu loát", 25],
  ["pronunciationScore", "pronunciationFeedback", "Phát âm", 25],
  ["vocabularyGrammarScore", "vocabularyGrammarFeedback", "Từ vựng & ngữ pháp", 20],
];

function rubricTotal(rubric) {
  if (!rubric) return null;
  const scores = RUBRIC_ITEMS.map(([scoreKey]) => rubric[scoreKey]);
  if (scores.some((score) => score === "" || score === undefined || score === null)) return null;
  return RUBRIC_ITEMS.reduce(
    (total, [scoreKey, , , weight]) => total + (Number(rubric[scoreKey]) * weight) / 100,
    0,
  );
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [tab, setTab] = useState("students");
  const [openStudentId, setOpenStudentId] = useState(null);
  const [gradingId, setGradingId] = useState(null);
  const [grades, setGrades] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useSuccessToast(message);

  async function load() {
    try {
      const [detail, submitted] = await Promise.all([
        classroomApi.teacherGet(id),
        classroomApi.submissions(id),
      ]);
      setData(detail);
      setSubmissions(submitted || []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Không thể tải dữ liệu lớp học");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const stats = useMemo(() => {
    const waiting = submissions.filter(
      (item) => item.type === "SPEAKING" && item.status === "SUBMITTED",
    ).length;
    return { waiting };
  }, [submissions]);

  const submissionsByStudent = useMemo(() => {
    const map = new Map();
    submissions.forEach((item) => {
      const list = map.get(item.studentId) || [];
      list.push(item);
      map.set(item.studentId, list);
    });
    return map;
  }, [submissions]);

  async function grade(item) {
    const current = grades[item.submissionId] || {};
    const rubric = Object.fromEntries(
      RUBRIC_ITEMS.flatMap(([scoreKey, feedbackKey]) => [
        [scoreKey, current[scoreKey] ?? item.rubric?.[scoreKey] ?? ""],
        [feedbackKey, current[feedbackKey] ?? item.rubric?.[feedbackKey] ?? ""],
      ]),
    );
    if (RUBRIC_ITEMS.some(([scoreKey]) => rubric[scoreKey] === "")) {
      setError("Vui lòng chấm điểm đủ bốn tiêu chí trong barem Speaking.");
      return;
    }
    if (
      RUBRIC_ITEMS.some(
        ([scoreKey]) =>
          Number.isNaN(Number(rubric[scoreKey])) ||
          Number(rubric[scoreKey]) < 0 ||
          Number(rubric[scoreKey]) > 100,
      )
    ) {
      setError("Điểm từng tiêu chí Speaking phải nằm trong khoảng 0–100.");
      return;
    }
    const weightedScore = rubricTotal(rubric);
    const feedback = current.feedback ?? item.feedback ?? "";
    setGradingId(item.submissionId);
    setError("");
    setMessage("");
    try {
      await speakingApi.grade(item.submissionId, {
        score: Number(weightedScore.toFixed(2)),
        feedback,
        rubric,
      });
      await load();
      setMessage(`Đã lưu kết quả Speaking của ${item.studentName}.`);
    } catch (e) {
      setError(e.response?.data?.message || "Không thể lưu điểm Speaking");
    } finally {
      setGradingId(null);
    }
  }

  if (error && !data)
    return (
      <main className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  if (!data) return <LoadingState />;

  const c = data.classroom;

  return (
    <main className="container py-5 course-shell class-management-detail">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link to="/teacher/classes">← Danh sách lớp</Link>
        <span className={`class-status ${String(c.status).toLowerCase()}`}>
          {classStatusLabel(c.status)}
        </span>
      </div>

      <section className="class-management-hero">
        <div>
          <p>QUẢN LÝ LỚP · {c.classCode}</p>
          <h1>{c.className}</h1>
          <span>{c.courseTitle}</span>
        </div>
        <div className="class-management-meta">
          <article>
            <span>Học viên</span>
            <strong>{c.studentCount}</strong>
          </article>
          <article>
            <span>Bài đã nộp</span>
            <strong>{submissions.length}</strong>
          </article>
          <article>
            <span>Speaking chờ chấm</span>
            <strong>{stats.waiting}</strong>
          </article>
        </div>
      </section>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="teacher-segmented class-management-tabs my-4">
        <button className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}>
          Học viên <span>{c.studentCount}</span>
        </button>
        <button className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}>
          Thông tin lớp
        </button>
      </div>

      {tab === "students" && (
        <section className="teacher-panel">
          <div className="teacher-panel-head">
            <div>
              <h2>Danh sách học viên</h2>
            </div>
          </div>
          <div className="teacher-panel-body class-student-review-list">
            {data.students.map((student) => {
              const studentSubmissions = submissionsByStudent.get(student.id) || [];
              const speakingWaiting = studentSubmissions.filter(
                (item) => item.type === "SPEAKING" && item.status === "SUBMITTED",
              ).length;
              const open = openStudentId === student.id;
              return (
                <article
                  className={`class-student-review-card ${open ? "open" : ""}`}
                  key={student.id}
                >
                  <button
                    className="class-student-review-head"
                    type="button"
                    onClick={() => setOpenStudentId(open ? null : student.id)}
                  >
                    <span className="student-list-avatar">
                      {student.fullName?.charAt(0)?.toUpperCase()}
                    </span>
                    <span className="class-student-review-person">
                      <strong>{student.fullName}</strong>
                      <small>{student.email}</small>
                    </span>
                    <span className="class-student-review-counts">
                      <b>{studentSubmissions.length} bài nộp</b>
                      {speakingWaiting > 0 && <em>{speakingWaiting} Speaking chờ chấm</em>}
                    </span>
                    <span className="class-student-review-toggle">
                      {open ? "Thu gọn ↑" : "Xem bài nộp ↓"}
                    </span>
                  </button>

                  {open && (
                    <div className="class-student-submissions">
                      {!studentSubmissions.length && (
                        <div className="teacher-empty">
                          Học viên này chưa nộp bài Listening hoặc Speaking nào.
                        </div>
                      )}
                      {studentSubmissions.map((item) => (
                        <article
                          className="class-submission-card"
                          key={`${item.type}-${item.submissionId}`}
                        >
                          <div className="class-submission-main">
                            <div className={`submission-type ${item.type.toLowerCase()}`}>
                              {typeLabel(item.type)}
                            </div>
                            <div className="class-submission-copy">
                              <div className="class-submission-title-row">
                                <h3>{item.activityTitle}</h3>
                                <span
                                  className={`submission-state ${String(item.status).toLowerCase()}`}
                                >
                                  {submissionStatus(item.status)}
                                </span>
                              </div>
                              <small>Nộp lúc {formatDateTime(item.submittedAt)}</small>
                            </div>
                            <div className="class-submission-score">
                              <span>Điểm</span>
                              <strong>
                                {item.score === null || item.score === undefined
                                  ? "—"
                                  : formatNumber(item.score)}
                              </strong>
                            </div>
                          </div>

                          {item.type === "SPEAKING" && (
                            <div className="class-speaking-review">
                              {item.recordingUrl ? (
                                <>
                                  <small>Bản ghi hiện hành #{item.revisionNumber || 1}</small>
                                  <AudioPlayer
                                    endpoint={`/teacher/speaking/submissions/${item.submissionId}/audio`}
                                  />
                                </>
                              ) : (
                                <span className="text-secondary">Không tìm thấy file ghi âm.</span>
                              )}
                              {item.revisions
                                ?.filter(
                                  (revision) => revision.revisionNumber !== item.revisionNumber,
                                )
                                .map((revision) => (
                                  <div className="my-2" key={revision.id}>
                                    <small>
                                      Bản ghi #{revision.revisionNumber} ·{" "}
                                      {formatDateTime(revision.submittedAt)}
                                    </small>
                                    <AudioPlayer
                                      endpoint={`/teacher/speaking/submissions/${item.submissionId}/revisions/${revision.id}/audio`}
                                    />
                                  </div>
                                ))}
                              <div className="class-grade-form">
                                <div className="w-100">
                                  <strong>Barem chấm điểm</strong>
                                  {RUBRIC_ITEMS.map(([scoreKey, feedbackKey, label, weight]) => (
                                    <div className="row g-2 align-items-start mt-1" key={scoreKey}>
                                      <div className="col-md-5">
                                        <label
                                          className="form-label"
                                          htmlFor={`class-${scoreKey}-${item.submissionId}`}
                                        >
                                          {label} ({weight}%)
                                        </label>
                                        <input
                                          id={`class-${scoreKey}-${item.submissionId}`}
                                          className="form-control"
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={
                                            grades[item.submissionId]?.[scoreKey] ??
                                            item.rubric?.[scoreKey] ??
                                            ""
                                          }
                                          onChange={(event) =>
                                            setGrades((current) => ({
                                              ...current,
                                              [item.submissionId]: {
                                                ...current[item.submissionId],
                                                [scoreKey]: event.target.value,
                                              },
                                            }))
                                          }
                                          placeholder="Điểm 0–100"
                                        />
                                      </div>
                                      <div className="col-md-7">
                                        <label
                                          className="form-label"
                                          htmlFor={`class-${feedbackKey}-${item.submissionId}`}
                                        >
                                          Nhận xét tiêu chí
                                        </label>
                                        <input
                                          id={`class-${feedbackKey}-${item.submissionId}`}
                                          className="form-control"
                                          value={
                                            grades[item.submissionId]?.[feedbackKey] ??
                                            item.rubric?.[feedbackKey] ??
                                            ""
                                          }
                                          onChange={(event) =>
                                            setGrades((current) => ({
                                              ...current,
                                              [item.submissionId]: {
                                                ...current[item.submissionId],
                                                [feedbackKey]: event.target.value,
                                              },
                                            }))
                                          }
                                          placeholder="Góp ý cụ thể (không bắt buộc)"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  <small className="d-block mt-2">
                                    Điểm tổng theo trọng số:{" "}
                                    {rubricTotal({
                                      ...item.rubric,
                                      ...grades[item.submissionId],
                                    }) === null
                                      ? "nhập đủ tiêu chí để tính"
                                      : `${formatNumber(
                                          rubricTotal({
                                            ...item.rubric,
                                            ...grades[item.submissionId],
                                          }),
                                        )}/100`}
                                  </small>
                                </div>
                                <input
                                  id={`class-feedback-${item.submissionId}`}
                                  className="form-control"
                                  value={grades[item.submissionId]?.feedback ?? item.feedback ?? ""}
                                  onChange={(event) =>
                                    setGrades((current) => ({
                                      ...current,
                                      [item.submissionId]: {
                                        ...current[item.submissionId],
                                        feedback: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Nhận xét cho học sinh"
                                />
                                <button
                                  className="btn btn-primary"
                                  disabled={gradingId === item.submissionId}
                                  onClick={() => grade(item)}
                                >
                                  {gradingId === item.submissionId
                                    ? "Đang lưu…"
                                    : item.status === "GRADED"
                                      ? "Cập nhật chấm"
                                      : "Chấm bài"}
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
            {!data.students.length && (
              <div className="content-empty">Chưa có học viên tham gia.</div>
            )}
          </div>
        </section>
      )}

      {tab === "info" && (
        <section className="teacher-panel">
          <div className="teacher-panel-head">
            <div>
              <h2>Thông tin lớp</h2>
            </div>
          </div>
          <div className="teacher-panel-body class-info-grid">
            <article>
              <span>Khóa học</span>
              <strong>{c.courseTitle}</strong>
            </article>
            <article>
              <span>Mã lớp</span>
              <strong>{c.classCode}</strong>
            </article>
            <article>
              <span>Giảng viên</span>
              <strong>{c.teacherName}</strong>
            </article>
            <article>
              <span>Sĩ số</span>
              <strong>
                {c.studentCount}
                {c.maxStudents ? ` / ${c.maxStudents}` : ""}
              </strong>
            </article>
            <article>
              <span>Ngày bắt đầu</span>
              <strong>{c.startDate || "Chưa đặt"}</strong>
            </article>
            <article>
              <span>Ngày kết thúc</span>
              <strong>{c.endDate || "Chưa đặt"}</strong>
            </article>
            <article className="wide">
              <span>Mô tả</span>
              <strong>{c.description || "Chưa có mô tả"}</strong>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
