import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import ProgressBar from "../../components/common/ProgressBar";
import MaterialShell from "../../components/learning/MaterialShell";
import { useAuth } from "../../contexts/AuthContext";
import { flashcardApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";
import {
  advanceFlashcardSession,
  createFlashcardSession,
  flashcardSessionStats,
  nextFlashcardReviewAt,
  restoreFlashcardSession,
} from "../../utils/flashcardSession";

const fallback = { to: "/flashcards", label: "Flashcard" };

export default function FlashcardDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const storageKey = `flashcard-session:${user?.id ?? user?.email ?? "student"}:${id}`;
  const [set, setSet] = useState(null);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState({ loading: true, working: false, error: "", loadError: null });
  const workingRef = useRef(false);
  const draggedRef = useRef(false);
  const zoomButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    let active = true;
    setSet(null);
    setSession(null);
    setSummary(null);
    setFlipped(false);
    setExpanded(false);
    setState({ loading: true, working: false, error: "", loadError: null });
    flashcardApi
      .get(id)
      .then((data) => {
        if (!active) return;
        setSet(data);
        let saved = null;
        try {
          saved = restoreFlashcardSession(
            JSON.parse(sessionStorage.getItem(storageKey)),
            data.cards || [],
          );
        } catch {
          // A damaged or unavailable tab session starts with the current due cards.
        }
        setSession(saved || createFlashcardSession(data.cards || []));
      })
      .catch((error) => {
        if (active)
          setState((current) => ({
            ...current,
            loadError: apiError(error, "Không thể tải flashcard"),
          }));
      })
      .finally(() => {
        if (active) setState((current) => ({ ...current, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [id, storageKey]);

  const cardId = session?.queue[0];
  const card = set?.cards?.find((item) => item.id === cardId);

  const mark = useCallback(
    async (status) => {
      if (!card || !session || workingRef.current) return;
      workingRef.current = true;
      setState((current) => ({ ...current, working: true, error: "" }));
      try {
        const updated = await flashcardApi.progress(card.id, status);
        const next = advanceFlashcardSession(session, card.id, status);
        setSet((current) => ({
          ...current,
          cards: current.cards.map((item) => (item.id === updated.id ? updated : item)),
        }));
        setFlipped(false);
        if (next.queue.length) {
          setSession(next);
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            /* Storage may be unavailable. */
          }
        } else {
          setSession(next);
          setSummary(next);
          setExpanded(false);
          try {
            sessionStorage.removeItem(storageKey);
          } catch {
            /* Storage may be unavailable. */
          }
        }
      } catch (error) {
        setState((current) => ({
          ...current,
          error: error.response?.data?.message || "Không thể lưu tiến độ. Vui lòng thử lại.",
        }));
      } finally {
        workingRef.current = false;
        setState((current) => ({ ...current, working: false }));
      }
    },
    [card, session, storageKey],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && expanded) {
        event.preventDefault();
        setExpanded(false);
        return;
      }
      const target = event.target;
      if (["INPUT", "TEXTAREA"].includes(target?.tagName) || target?.isContentEditable) return;
      if (!card || summary || state.working) return;
      if (event.code === "Space") {
        if (target?.tagName === "BUTTON") return;
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (event.key === "1") {
        event.preventDefault();
        mark("REVIEW");
      } else if (event.key === "2") {
        event.preventDefault();
        mark("REMEMBERED");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [card, expanded, mark, state.working, summary]);

  useEffect(() => {
    if (!expanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      zoomButtonRef.current?.focus();
    };
  }, [expanded]);

  function viewAll() {
    const all = createFlashcardSession(set.cards, "all");
    setSession(all);
    setSummary(null);
    setFlipped(false);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(all));
    } catch {
      /* Storage may be unavailable. */
    }
  }

  if (state.loading) return <LoadingState />;
  if (!set)
    return (
      <main className="container py-5">
        <ErrorState error={state.loadError} actions={[fallback]} />
      </main>
    );

  const cards = set.cards || [];
  const back = set.personal || !set.lessonId ? "/flashcards" : `/lessons/${set.lessonId}`;
  const nextReview = nextFlashcardReviewAt(cards);
  const stats = summary ? flashcardSessionStats(summary) : null;
  const total = session?.initialIds.length || 0;
  const studied = session ? Object.keys(session.outcomes).length : 0;

  const study = card && (
    <div className="fc-study" key={card.id}>
      {!expanded && (
        <div className="fc-study-toolbar">
          <button
            ref={zoomButtonRef}
            type="button"
            className="fc-zoom-button"
            aria-label="Phóng to"
            title="Phóng to"
            onClick={() => setExpanded(true)}
          >
            ⤢
          </button>
        </div>
      )}
      <div className="fc-scene">
        <motion.div
          className="fc-card-3d"
          drag={expanded ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          dragSnapToOrigin
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) < 70 && Math.abs(info.velocity.x) < 250) return;
            draggedRef.current = true;
            window.setTimeout(() => {
              draggedRef.current = false;
            }, 100);
            mark(info.offset.x > 0 ? "REMEMBERED" : "REVIEW");
          }}
          onClick={() => {
            if (!draggedRef.current && !state.working) setFlipped((value) => !value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              setFlipped((value) => !value);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={flipped ? "Lật lại mặt trước" : "Lật xem mặt sau"}
          animate={{ rotateY: expanded ? 0 : flipped ? 180 : 0 }}
          transition={{ duration: expanded ? 0 : 0.42 }}
          whileHover={expanded ? undefined : { scale: 1.01 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="fc-face fc-face-front" aria-hidden={flipped} inert={flipped}>
            <div className="fc-face-badge">
              <span className="fc-face-hint">MẶT TRƯỚC</span>
            </div>
            <div className="fc-face-body">
              {card.imageUrl && (
                <div className="fc-image-wrap">
                  <img src={card.imageUrl} alt={card.frontText} className="fc-image" />
                </div>
              )}
              <h1 className="fc-front-text">{card.frontText}</h1>
              {card.pronunciation && <div className="fc-pronunciation">{card.pronunciation}</div>}
              {card.audioUrl && (
                <audio
                  controls
                  src={card.audioUrl}
                  className="fc-audio"
                  onClick={(event) => event.stopPropagation()}
                />
              )}
            </div>
          </div>
          <div className="fc-face fc-face-back" aria-hidden={!flipped} inert={!flipped}>
            <div className="fc-face-badge">
              <span className="fc-face-hint">MẶT SAU</span>
            </div>
            <div className="fc-face-body">
              <h2 className="fc-back-text">{card.backText}</h2>
              {card.exampleSentence && (
                <blockquote className="fc-example">
                  <p className="fc-example-text">“{card.exampleSentence}”</p>
                </blockquote>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      {state.error && (
        <div className="alert alert-danger mt-2" role="alert">
          {state.error}
        </div>
      )}
      <div className="fc-rating-buttons fc-session-actions">
        <button
          type="button"
          className="fc-rate-btn rate-review"
          disabled={state.working}
          onClick={() => mark("REVIEW")}
        >
          Chưa nhớ
        </button>
        <button
          type="button"
          className="fc-rate-btn rate-remembered"
          disabled={state.working}
          onClick={() => mark("REMEMBERED")}
        >
          Đã nhớ
        </button>
      </div>
    </div>
  );

  return (
    <MaterialShell
      lessonId={set.personal ? null : set.lessonId}
      type="FLASHCARD"
      materialId={set.id}
      title={set.title}
      fallback={fallback}
      compact
      hideCompactTitle
      showPager={false}
    >
      <main className="container fc-container fc-session-page">
        {!summary && card && (
          <div className="fc-session-progress" aria-label="Tiến độ phiên học">
            <span>
              Đã học {studied}/{total} thẻ
            </span>
            <span>Còn {session.queue.length} lượt</span>
            <ProgressBar value={studied} max={total} variant="primary" size="sm" />
          </div>
        )}
        {summary ? (
          <section className="fc-session-summary">
            <h1>Hoàn thành phiên học</h1>
            <div className="fc-session-summary-stats">
              <p>
                <strong>{stats.studied}</strong>
                <span>Thẻ đã học</span>
              </p>
              <p>
                <strong>{stats.remembered}</strong>
                <span>Đã nhớ</span>
              </p>
              <p>
                <strong>{stats.review}</strong>
                <span>Cần ôn tiếp</span>
              </p>
            </div>
            <Link className="btn btn-primary" to={back}>
              Về bài học
            </Link>
          </section>
        ) : card ? (
          expanded ? (
            createPortal(
              <div
                className="fc-zoom-overlay"
                role="dialog"
                aria-modal="true"
                aria-label="Thẻ Flashcard phóng to"
              >
                <div className="fc-zoom-panel">
                  <div className="fc-zoom-top">
                    <span>
                      Đã học {studied}/{total} thẻ
                    </span>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      className="fc-zoom-button fc-zoom-shrink"
                      aria-label="Thu nhỏ"
                      title="Thu nhỏ"
                      onClick={() => setExpanded(false)}
                    >
                      ⤡
                    </button>
                  </div>
                  {study}
                </div>
              </div>,
              document.body,
            )
          ) : (
            study
          )
        ) : (
          <section className="fc-session-empty">
            <h1>{cards.length ? "Hôm nay chưa có thẻ cần ôn" : "Bộ Flashcard chưa có thẻ"}</h1>
            {nextReview && (
              <p>
                Lần ôn tiếp theo:{" "}
                {new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(nextReview)}
              </p>
            )}
            {cards.length > 0 && (
              <button type="button" className="btn btn-outline-primary" onClick={viewAll}>
                Xem toàn bộ thẻ
              </button>
            )}
          </section>
        )}
      </main>
    </MaterialShell>
  );
}
