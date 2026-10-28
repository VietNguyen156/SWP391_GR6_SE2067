import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "../../components/common/Icon";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { useConfirm } from "../../components/common/ConfirmDialog";
import AttachmentList from "../../components/grammar/AttachmentList";
import MaterialShell from "../../components/learning/MaterialShell";
import QuestionCard, { answeredWrong } from "../../components/learning/QuestionCard";
import Passage from "../../components/reading/Passage";
import { readingApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";
import { formatDateTime, formatPercent } from "../../utils/format";
import { readingKind } from "../../utils/lessonMaterials";
import { parseMarkdown, plainText } from "../../utils/markdown";

/**
 * Trang làm Reading: máy tính chia đôi như TOEIC Part 7 (trái: đoạn văn + tệp, cuộn riêng; phải: câu
 * hỏi). Điện thoại xếp chồng, có nút nổi "Xem lại đoạn văn". Sau khi nộp: điểm, Đúng/Sai, giải thích
 * câu sai và tô sáng căn cứ trong bài.
 */
export default function ReadingPage() {
  const { id } = useParams();
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [focus, setFocus] = useState(null);
  const submitLock = useRef(false);
  const source = useRef(null);
  const [sourceVisible, setSourceVisible] = useState(true);

  useEffect(() => {
    let active = true;
    setData(null);
    setAnswers({});
    setResult(null);
    setError("");
    setLoadError(null);
    setFocus(null);
    Promise.all([readingApi.studentGet(id), readingApi.result(id)])
      .then(([activity, previous]) => {
        if (!active) return;
        setData(activity);
        if (previous) {
          setResult(previous);
          setAnswers(previous.answers || {});
        }
      })
      .catch((e) => active && setLoadError(apiError(e, "Không thể tải bài đọc")));
    return () => {
      active = false;
    };
  }, [id]);

  // Nút nổi "Xem lại đoạn văn" chỉ hiện khi bài đọc đã cuộn khỏi màn hình (không che chữ khi đang đọc).
  useEffect(() => {
    const el = source.current;
    if (!el || !window.IntersectionObserver) return undefined;
    const observer = new IntersectionObserver(([entry]) => setSourceVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  async function submit() {
    if (submitLock.current || result) return;
    const unanswered = data.questions.filter((q) => !answers[q.id]).length;
    if (unanswered) {
      const ok = await confirm({
        title: "Nộp bài khi chưa làm hết?",
        message: `Bạn còn ${unanswered} câu chưa chọn đáp án. Câu bỏ trống sẽ tính là sai và bạn không thể làm lại.`,
        confirmLabel: "Vẫn nộp bài",
        cancelLabel: "Làm tiếp",
      });
      if (!ok) return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const saved = await readingApi.submit(id, answers);
      setResult(saved);
      setAnswers(saved.answers || answers);
    } catch (e) {
      setError(apiError(e, "Không thể nộp bài").message || "Không thể nộp bài");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  function showEvidence(index) {
    // Bấm lại cùng câu vẫn cuộn tới đoạn trích.
    setFocus(null);
    requestAnimationFrame(() => setFocus(index));
  }

  if (loadError)
    return (
      <main className="container py-5">
        <ErrorState error={loadError} actions={[{ label: "Khóa học của tôi", to: "/courses" }]} />
      </main>
    );
  if (!data) return <LoadingState />;

  const questions = data.questions || [];
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const marks = result ? questions.map((q) => result.evidence?.[q.id] || "") : [];
  const files = data.attachments || [];
  // Căn cứ nằm trong đoạn văn thì tô sáng được; nằm trong tệp đính kèm thì trích dẫn dưới câu hỏi.
  const passageText = data.passage
    ? plainText(parseMarkdown(data.passage, data.passageFormat))
    : "";

  return (
    <MaterialShell
      lessonId={data.lessonId}
      type="READING"
      materialId={data.id}
      title={data.title}
      compact
      showPager={false}
    >
      <main className="container student-activity-shell reading-shell">
        <section className="student-activity-hero">
          <div>
            <p className="rp-kind">{readingKind(data)}</p>
            <h1>{data.title}</h1>
            <p>{data.instruction || data.description}</p>
          </div>
          <div className="student-activity-progress">
            <span>{result ? "KẾT QUẢ" : "TIẾN ĐỘ"}</span>
            <strong>
              {result ? formatPercent(result.score || 0) : `${answeredCount}/${questions.length}`}
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
              <span>
                Mỗi câu có căn cứ: bấm “Xem căn cứ trong bài” để thấy câu văn chứa đáp án.
              </span>
            </div>
            {result.submittedAt && <time>{formatDateTime(result.submittedAt)}</time>}
          </section>
        )}

        <div className="rp-split">
          <section className="rp-source" id="rp-source" ref={source} aria-label="Bài đọc">
            {data.passage && (
              <Passage
                passage={data.passage}
                format={data.passageFormat}
                multi={data.passageType !== "SINGLE"}
                marks={marks}
                focus={focus}
              />
            )}
            <AttachmentList
              attachments={files}
              api={readingApi}
              pdfOpen
              title={data.passage ? "Tài liệu kèm bài đọc" : "Bài đọc"}
            />
          </section>

          <section className="rp-questions" aria-label="Câu hỏi">
            <div className="student-question-stack">
              {questions.map((question, index) => (
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
                  {result && (
                    <div className="rp-feedback">
                      {answeredWrong(question, answers[question.id], result) &&
                        result.explanations?.[question.id] && (
                          <p className="rp-explain">
                            <strong>Giải thích:</strong> {result.explanations[question.id]}
                          </p>
                        )}
                      {marks[index] && !passageText.includes(marks[index]) && (
                        <p className="rp-explain">
                          <strong>Căn cứ (trong tệp đính kèm):</strong> “{marks[index]}”
                        </p>
                      )}
                      {marks[index] && passageText.includes(marks[index]) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => showEvidence(index)}
                        >
                          <Icon name="eye" size={15} /> Xem căn cứ trong bài
                        </button>
                      )}
                    </div>
                  )}
                </QuestionCard>
              ))}
            </div>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="student-submit-bar">
              <div>
                <span>
                  {result
                    ? "Bài đã hoàn tất"
                    : `${answeredCount}/${questions.length} câu đã trả lời`}
                </span>
                <small>
                  {result
                    ? "Kết quả đã được lưu trong hệ thống."
                    : "Kiểm tra đáp án trước khi nộp."}
                </small>
              </div>
              {!result && (
                <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>
                  {submitting ? "Đang nộp…" : "Nộp bài"}
                </button>
              )}
            </div>
          </section>
        </div>

        <button
          type="button"
          className={`btn btn-primary rp-jump ${sourceVisible ? "is-hidden" : ""}`}
          onClick={() => source.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <Icon name="book" size={16} /> Xem lại đoạn văn
        </button>
      </main>
    </MaterialShell>
  );
}
