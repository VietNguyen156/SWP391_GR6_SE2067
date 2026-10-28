import { useEffect, useState } from "react";
import AudioPlayer from "../common/AudioPlayer";
import Icon from "../common/Icon";
import AttachmentList from "../grammar/AttachmentList";
import GrammarContents from "../grammar/GrammarContents";
import Passage from "../reading/Passage";
import { readingApi, speakingApi } from "../../services/learningContentService";
import { readingKind } from "../../utils/lessonMaterials";
import { enumLabel } from "../../utils/statusLabels";

// Nội dung trang Xem của từng loại học liệu, hiển thị gần giống phía học viên.

function Stats({ items }) {
  return (
    <ul className="mv-stats">
      {items.map(([label, value]) => (
        <li key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

const Empty = ({ children }) => <p className="mv-empty">{children}</p>;

export function GrammarPreview({ item }) {
  const empty = !item.contents?.length;
  return (
    <>
      {item.description && <p className="mv-lead pre-line">{item.description}</p>}
      <GrammarContents contents={item.contents} />
      {empty && <Empty>Chủ đề chưa có nội dung giải thích hay tài liệu.</Empty>}
    </>
  );
}

/** Lưới thẻ chữ to; "Xem dạng lật thẻ" lật từng thẻ như học viên. */
export function FlashcardPreview({ item }) {
  const cards = item.cards || [];
  const [flipMode, setFlipMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const go = (next) => {
    setIndex((next + cards.length) % cards.length);
    setFlipped(false);
  };
  const card = cards[index];
  return (
    <>
      {item.description && <p className="mv-lead pre-line">{item.description}</p>}
      <div className="mv-section-head">
        <h2>{cards.length} thẻ</h2>
        {cards.length > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => {
              setFlipMode((v) => !v);
              setFlipped(false);
            }}
          >
            {flipMode ? "Xem dạng lưới" : "Xem dạng lật thẻ"}
          </button>
        )}
      </div>
      {!cards.length && <Empty>Bộ thẻ chưa có thẻ nào.</Empty>}
      {flipMode && card ? (
        <div className="fc-flip">
          <button
            type="button"
            className={`fc-flip-card ${flipped ? "is-back" : ""}`}
            onClick={() => setFlipped((v) => !v)}
            aria-label={flipped ? "Lật về mặt trước" : "Lật xem nghĩa"}
          >
            {flipped ? (
              <>
                <span className="fc-back">{card.backText}</span>
                {card.exampleSentence && <span className="fc-example">{card.exampleSentence}</span>}
              </>
            ) : (
              <>
                <span className="fc-front">{card.frontText}</span>
                <CardMeta card={card} />
              </>
            )}
            <small className="fc-flip-hint">{flipped ? "Mặt sau" : "Bấm để lật"}</small>
          </button>
          <div className="fc-flip-nav">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => go(index - 1)}
            >
              ‹ Thẻ trước
            </button>
            <span aria-live="polite">
              {index + 1} / {cards.length}
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => go(index + 1)}
            >
              Thẻ sau ›
            </button>
          </div>
        </div>
      ) : (
        <ol className="fc-grid">
          {cards.map((c) => (
            <li className="fc-card" key={c.id}>
              <span className="fc-front">{c.frontText}</span>
              <CardMeta card={c} />
              <span className="fc-back">{c.backText}</span>
              {c.exampleSentence && <span className="fc-example">{c.exampleSentence}</span>}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function CardMeta({ card }) {
  if (!card.pronunciation && !card.wordType) return null;
  return (
    <span className="fc-meta">
      {card.pronunciation && <span className="fc-meta-ipa">{card.pronunciation}</span>}
      {card.pronunciation && card.wordType && " · "}
      {card.wordType}
    </span>
  );
}

/** Câu hỏi trắc nghiệm kèm đáp án đúng (Listening, Reading). */
function QuestionList({ questions, text, optionText, explanation, evidence }) {
  if (!questions.length) return <Empty>Chưa có câu hỏi.</Empty>;
  return (
    <ol className="mv-questions">
      {questions.map((q, i) => (
        <li key={q.id ?? i}>
          <p className="mv-q-text">
            <span className="mv-q-no">Câu {i + 1}</span> {text(q)}
          </p>
          <ul className="mv-options">
            {(q.options || []).map((o, k) => (
              <li key={o.id ?? k} className={o.correct ? "is-correct" : ""}>
                <span className="mv-option-key">{String.fromCharCode(65 + k)}</span>
                <span>{optionText(o)}</span>
                {o.correct && (
                  <span className="mv-correct">
                    <Icon name="check" size={14} /> Đáp án đúng
                  </span>
                )}
              </li>
            ))}
          </ul>
          {evidence?.(q) && (
            <p className="mv-explain mv-evidence">
              <strong>Căn cứ trong bài:</strong> “{evidence(q)}”
            </p>
          )}
          {explanation?.(q) && (
            <p className="mv-explain">
              <strong>Giải thích:</strong> {explanation(q)}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function ListeningPreview({ item }) {
  const questions = item.questions || [];
  return (
    <>
      <Stats
        items={[
          ["câu hỏi", questions.length],
          ["lượt học viên đã làm", item.attemptCount ?? 0],
        ]}
      />
      {item.description && <p className="mv-lead pre-line">{item.description}</p>}
      {item.instruction && <p className="mv-instruction pre-line">{item.instruction}</p>}
      <section className="mv-block">
        <h2>Audio</h2>
        {item.audioUrl ? (
          <AudioPlayer endpoint={`/media/listening?url=${encodeURIComponent(item.audioUrl)}`} />
        ) : (
          <Empty>Chưa có file audio.</Empty>
        )}
      </section>
      <section className="mv-block">
        <h2>Câu hỏi</h2>
        <QuestionList
          questions={questions}
          text={(q) => q.questionText}
          optionText={(o) => o.optionText}
        />
      </section>
    </>
  );
}

/** Đoạn văn (căn cứ tô sáng), tệp đính kèm, câu hỏi kèm đáp án đúng + căn cứ, số lượt làm. */
export function ReadingPreview({ item }) {
  const questions = item.questions || [];
  const files = item.attachments || [];
  return (
    <>
      <Stats
        items={[
          ["câu hỏi", questions.length],
          ["lượt học viên đã làm", item.attemptCount ?? 0],
          ["tệp đính kèm", files.length],
        ]}
      />
      {item.status !== "PUBLISHED" && (
        <p className="mv-note">
          Học viên chưa thấy bài này: cần có đoạn văn hoặc ít nhất một tệp đính kèm.
        </p>
      )}
      <p className="rp-kind">{readingKind(item)}</p>
      {item.description && <p className="mv-lead pre-line">{item.description}</p>}
      {item.instruction && <p className="mv-instruction pre-line">{item.instruction}</p>}
      <section className="mv-block">
        <h2>Đoạn văn</h2>
        {item.passage ? (
          <Passage
            passage={item.passage}
            format={item.passageFormat}
            multi={item.passageType !== "SINGLE"}
            marks={questions.map((q) => q.evidence || "")}
          />
        ) : (
          <Empty>Bài chỉ dùng tệp đính kèm, không có đoạn văn nhập trực tiếp.</Empty>
        )}
      </section>
      {files.length > 0 && (
        <section className="mv-block">
          <AttachmentList attachments={files} api={readingApi} title="Tệp đính kèm" />
        </section>
      )}
      <section className="mv-block">
        <h2>Câu hỏi</h2>
        <QuestionList
          questions={questions}
          text={(q) => q.questionText}
          optionText={(o) => o.optionText}
          evidence={(q) => q.evidence}
          explanation={(q) => q.explanation}
        />
      </section>
    </>
  );
}

const subStatus = (v) => ({ SUBMITTED: "Chờ chấm", GRADED: "Đã chấm" })[v] || v;

/** Đề bài, số bài nộp và phần chấm bài (chuyển từ trang sửa sang đây). */
export function SpeakingPreview({ item }) {
  const [subs, setSubs] = useState(null);
  const [message, setMessage] = useState({ error: "", ok: "" });
  useEffect(() => {
    speakingApi
      .submissions(item.id)
      .then(setSubs)
      .catch(() => setSubs([]));
  }, [item.id]);

  async function grade(event, sub) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const score = Number(data.get("score"));
    if (data.get("score") === "" || score < 0 || score > 100)
      return setMessage({ error: "Điểm Speaking phải từ 0 đến 100", ok: "" });
    try {
      await speakingApi.grade(sub.id, { score, feedback: data.get("feedback") });
      setSubs(await speakingApi.submissions(item.id));
      setMessage({ error: "", ok: `Đã lưu điểm cho ${sub.studentName}` });
    } catch (e) {
      setMessage({ error: e.response?.data?.message || "Không thể chấm bài", ok: "" });
    }
  }

  return (
    <>
      <Stats
        items={[
          ["bài nộp", item.submissionCount ?? 0],
          ["bài chờ chấm", item.pendingCount ?? 0],
        ]}
      />
      {item.pendingCount > 0 && (
        <a className="btn btn-primary btn-sm mv-grade-link" href="#cham-bai">
          Chấm bài ({item.pendingCount})
        </a>
      )}
      <section className="mv-block">
        <h2>Yêu cầu</h2>
        <p className="pre-line">{item.instruction || "—"}</p>
      </section>
      {item.promptText && (
        <section className="mv-block">
          <h2>Nội dung học viên cần nói</h2>
          <blockquote className="mv-prompt pre-line">{item.promptText}</blockquote>
        </section>
      )}
      <section className="mv-block" id="cham-bai">
        <h2>Bài nộp của học viên</h2>
        {message.error && <div className="alert alert-danger">{message.error}</div>}
        {message.ok && (
          <div className="alert alert-success" role="status">
            {message.ok}
          </div>
        )}
        {subs === null ? (
          <p className="mv-empty">Đang tải bài nộp…</p>
        ) : !subs.length ? (
          <Empty>Chưa có học viên nộp bài.</Empty>
        ) : (
          <ul className="mv-subs">
            {subs.map((s) => (
              <li key={s.id}>
                <div className="mv-sub-head">
                  <strong>{s.studentName}</strong>
                  <span className={`mv-sub-status ${s.status === "GRADED" ? "is-done" : ""}`}>
                    {subStatus(s.status)}
                  </span>
                </div>
                <AudioPlayer endpoint={`/teacher/speaking/submissions/${s.id}/audio`} />
                <form className="mv-grade" onSubmit={(e) => grade(e, s)}>
                  <input
                    className="form-control"
                    name="score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={s.score ?? ""}
                    placeholder="Điểm"
                    aria-label={`Điểm của ${s.studentName}`}
                  />
                  <input
                    className="form-control"
                    name="feedback"
                    defaultValue={s.feedback || ""}
                    placeholder="Nhận xét"
                    aria-label={`Nhận xét cho ${s.studentName}`}
                  />
                  <button className="btn btn-primary">Lưu chấm</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
