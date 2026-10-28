// Chuyển response chi tiết của API thành giá trị form ở các trang "Chỉnh sửa".
// Quy ước: id dùng trong <select> luôn là chuỗi; null/undefined → ""; ngày qua toDateInput().
import { toDateInput } from "./format.js";

const text = (value) => (value === null || value === undefined ? "" : String(value));
const idText = (value) => (value === null || value === undefined ? "" : String(value));

/** Vị trí Khóa → Tuần → Bài của một học liệu (courseId tìm từ danh sách tuần). */
function placementToForm(data, courseId) {
  return {
    courseId: idText(courseId),
    courseWeekId: idText(data?.courseWeekId),
    lessonId: idText(data?.lessonId),
  };
}

/** GET /teacher/classes/{id} trả { classroom, students, ... } — dữ liệu lớp nằm trong `classroom`. */
export function classToForm(detail) {
  const c = detail?.classroom ?? detail;
  return {
    courseId: idText(c.courseId),
    className: text(c.className),
    classCode: text(c.classCode),
    description: text(c.description),
    startDate: toDateInput(c.startDate),
    endDate: toDateInput(c.endDate),
    maxStudents: text(c.maxStudents),
    status: c.status || "OPEN",
  };
}

export function weekToForm(week) {
  return {
    title: week.title || `Tuần ${week.weekNumber}`,
    description: text(week.description),
    status: week.status || "DRAFT",
  };
}

export function lessonToForm(lesson) {
  return {
    courseId: idText(lesson.courseId),
    courseWeekId: idText(lesson.courseWeekId),
    title: text(lesson.title),
    description: text(lesson.description),
    estimatedMinutes: text(lesson.estimatedMinutes),
  };
}

export function grammarToForm(topic, courseId) {
  return {
    ...placementToForm(topic, courseId),
    title: text(topic.title),
    description: text(topic.description),
    level: topic.level || "BEGINNER",
  };
}

const CARD_FIELDS = [
  "frontText",
  "backText",
  "pronunciation",
  "wordType",
  "exampleSentence",
  "imageUrl",
  "audioUrl",
];
/** Chỉ giữ các trường soạn được của thẻ (bỏ tiến độ ôn của người xem). */
function cardToForm(card) {
  return {
    id: card.id ?? null,
    ...Object.fromEntries(CARD_FIELDS.map((field) => [field, text(card[field])])),
    sortOrder: card.sortOrder ?? null,
  };
}

export function flashcardSetToForm(set, courseId) {
  return {
    ...placementToForm(set, courseId),
    title: text(set.title),
    description: text(set.description),
    topic: text(set.topic),
    toeicPart: set.toeicPart || "GENERAL",
    difficulty: set.difficulty || "MEDIUM",
    cards: (set.cards || []).map(cardToForm),
  };
}

export function personalFlashcardToForm(set) {
  return {
    title: text(set.title),
    description: text(set.description),
    topic: text(set.topic),
    toeicPart: set.toeicPart || "GENERAL",
    difficulty: set.difficulty || "MEDIUM",
    cards: (set.cards || []).map(cardToForm),
  };
}

export function listeningToForm(activity, courseId) {
  return {
    ...placementToForm(activity, courseId),
    title: text(activity.title),
    description: text(activity.description),
    instruction: text(activity.instruction),
    audioUrl: text(activity.audioUrl),
    questions: (activity.questions || []).map((q) => ({
      questionText: text(q.questionText),
      options: (q.options || []).map((o) => ({
        optionText: text(o.optionText),
        correct: Boolean(o.correct),
      })),
    })),
  };
}

export function speakingToForm(activity, courseId) {
  return {
    ...placementToForm(activity, courseId),
    title: text(activity.title),
    instruction: text(activity.instruction),
    promptText: text(activity.promptText),
  };
}

export function questionToForm(question) {
  return {
    lessonId: idText(question.lessonId),
    questionText: text(question.questionText),
    explanation: text(question.explanation),
    difficulty: question.difficulty || "MEDIUM",
    options: (question.options || []).map((o) => ({
      id: o.id,
      content: text(o.content),
      correct: Boolean(o.correct),
    })),
  };
}

export function profileToForm(user) {
  return {
    fullName: text(user.fullName),
    phone: text(user.phone),
    avatarUrl: text(user.avatarUrl),
  };
}

export function readingToForm(activity, courseId) {
  return {
    ...placementToForm(activity, courseId),
    title: text(activity.title),
    description: text(activity.description),
    instruction: text(activity.instruction),
    passage: text(activity.passage),
    passageFormat: activity.passageFormat || "MARKDOWN",
    toeicPart: activity.toeicPart || "PART_7",
    passageType: activity.passageType || "SINGLE",
    questions: (activity.questions || []).map((q) => ({
      questionText: text(q.questionText),
      explanation: text(q.explanation),
      evidence: text(q.evidence),
      options: (q.options || []).map((o) => ({
        optionText: text(o.optionText),
        correct: Boolean(o.correct),
      })),
    })),
  };
}
