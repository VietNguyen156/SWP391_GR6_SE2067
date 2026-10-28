export const FLASHCARD_SESSION_VERSION = 1;

export function isFlashcardDue(card, now = new Date()) {
  if (card.memoryStatus === "NEW" || !card.memoryStatus) return true;
  if (!card.nextReviewAt) return true;
  const dueAt = new Date(card.nextReviewAt).getTime();
  return !Number.isFinite(dueAt) || dueAt <= now.getTime();
}

export function nextFlashcardReviewAt(cards, now = new Date()) {
  const dates = cards
    .filter((card) => !isFlashcardDue(card, now) && card.nextReviewAt)
    .map((card) => new Date(card.nextReviewAt).getTime());
  return dates.length ? new Date(Math.min(...dates)) : null;
}

export function createFlashcardSession(cards, mode = "due", now = new Date()) {
  const initialIds = cards
    .filter((card) => mode === "all" || isFlashcardDue(card, now))
    .map((card) => card.id);
  return {
    version: FLASHCARD_SESSION_VERSION,
    mode,
    createdAt: now.getTime(),
    initialIds,
    queue: [...initialIds],
    repeatedIds: [],
    outcomes: {},
  };
}

export function restoreFlashcardSession(raw, cards, now = new Date()) {
  if (!raw || raw.version !== FLASHCARD_SESSION_VERSION) return null;
  if (raw.mode !== "due" && raw.mode !== "all") return null;
  if (!Number.isFinite(raw.createdAt) || now.getTime() - raw.createdAt >= 86400000) return null;
  if (
    !Array.isArray(raw.queue) ||
    !Array.isArray(raw.initialIds) ||
    !Array.isArray(raw.repeatedIds)
  )
    return null;
  if (!raw.outcomes || typeof raw.outcomes !== "object" || Array.isArray(raw.outcomes)) return null;
  const ids = new Set(cards.map((card) => card.id));
  if (raw.queue.some((id) => !ids.has(id)) || raw.initialIds.some((id) => !ids.has(id)))
    return null;
  if (!raw.queue.length) return null;
  return raw;
}

export function advanceFlashcardSession(session, cardId, status) {
  if (session.queue[0] !== cardId || !["REVIEW", "REMEMBERED"].includes(status)) {
    throw new Error("Invalid flashcard session action");
  }
  const queue = session.queue.slice(1);
  const repeatedIds = [...session.repeatedIds];
  if (status === "REVIEW" && !repeatedIds.includes(cardId)) {
    // Appending gives the card the largest available gap before its only repeat.
    queue.push(cardId);
    repeatedIds.push(cardId);
  }
  return {
    ...session,
    queue,
    repeatedIds,
    outcomes: { ...session.outcomes, [cardId]: status },
  };
}

export function flashcardSessionStats(session) {
  const outcomes = Object.values(session.outcomes);
  return {
    studied: outcomes.length,
    remembered: outcomes.filter((status) => status === "REMEMBERED").length,
    review: outcomes.filter((status) => status === "REVIEW").length,
  };
}
