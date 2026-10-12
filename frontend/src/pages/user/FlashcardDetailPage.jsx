import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { enumLabel } from "../../utils/statusLabels";
import { useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import MaterialShell from "../../components/learning/MaterialShell";
import { flashcardApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";

const fallback = { to: "/review", label: "Ôn tập" };
export default function FlashcardDetailPage() {
  const { id } = useParams();
  const [set, setSet] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [state, setState] = useState({ loading: true, working: false, error: "" });
  useEffect(() => {
    let active = true;
    setSet(null);
    setIndex(0);
    setFlipped(false);
    setState({ loading: true, working: false, error: "" });
    flashcardApi
      .get(id)
      .then((data) => active && setSet(data))
      .catch(
        (e) =>
          active &&
          setState((s) => ({
            ...s,
            loadError: apiError(e, "Không thể tải flashcard"),
          })),
      )
      .finally(() => active && setState((s) => ({ ...s, loading: false })));
    return () => {
      active = false;
    };
  }, [id]);
  async function mark(status) {
    const card = set.cards[index];
    setState((s) => ({ ...s, working: true, error: "" }));
    try {
      const updated = await flashcardApi.progress(card.id, status);
      setSet((current) => ({
        ...current,
        cards: current.cards.map((c) => (c.id === updated.id ? updated : c)),
      }));
      setFlipped(false);
      if (index < set.cards.length - 1) setIndex(index + 1);
    } catch (e) {
      setState((s) => ({ ...s, error: e.response?.data?.message || "Không thể lưu tiến độ" }));
    } finally {
      setState((s) => ({ ...s, working: false }));
    }
  }
  if (state.loading) return <LoadingState />;
  if (!set)
    return (
      <main className="container py-5">
        <ErrorState error={state.loadError} actions={[fallback]} />
      </main>
    );
  const card = set.cards[index];
  return (
    <MaterialShell
      lessonId={set.personal ? null : set.lessonId}
      type="FLASHCARD"
      materialId={set.id}
      title={set.title}
      fallback={fallback}
    >
      <main className="container py-4 content-shell">
        <div className="flash-study-head">
          <div>
            <span>{set.topic || set.toeicPart}</span>
            <h1>{set.title}</h1>
          </div>
          <b>
            {set.cards.length ? index + 1 : 0} / {set.cards.length}
          </b>
        </div>
        {!card ? (
          <div className="empty-content">Bộ này chưa có thẻ.</div>
        ) : (
          <>
            <button
              className={`flash-study-card ${flipped ? "flipped" : ""}`}
              onClick={() => setFlipped(!flipped)}
            >
              <div className="flash-face">
                <small>{flipped ? "MẶT SAU" : "MẶT TRƯỚC"}</small>
                {card.imageUrl && !flipped && <img src={card.imageUrl} alt="" />}
                <h2>{flipped ? card.backText : card.frontText}</h2>
                {!flipped && card.pronunciation && <p>{card.pronunciation}</p>}
                {flipped && card.exampleSentence && <blockquote>{card.exampleSentence}</blockquote>}
                <span>Nhấn để lật thẻ</span>
              </div>
            </button>
            <div className="flash-progress-status">
              Trạng thái: <b>{enumLabel(card.memoryStatus)}</b> · Đã ôn {card.reviewCount} lần
            </div>
            {state.error && <div className="alert alert-danger">{state.error}</div>}
            <div className="flash-actions">
              <button
                className="btn btn-outline-secondary"
                disabled={state.working || index === 0}
                onClick={() => {
                  setIndex(index - 1);
                  setFlipped(false);
                }}
              >
                ← Trước
              </button>
              <button
                className="btn btn-warning"
                disabled={state.working}
                onClick={() => mark("REVIEW")}
              >
                Cần ôn lại
              </button>
              <button
                className="btn btn-primary"
                disabled={state.working}
                onClick={() => mark("LEARNING")}
              >
                Đang học
              </button>
              <button
                className="btn btn-success"
                disabled={state.working}
                onClick={() => mark("REMEMBERED")}
              >
                Đã nhớ
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={state.working || index === set.cards.length - 1}
                onClick={() => {
                  setIndex(index + 1);
                  setFlipped(false);
                }}
              >
                Sau →
              </button>
            </div>
          </>
        )}
      </main>
    </MaterialShell>
  );
}
