// Đọc câu hỏi/thẻ từ file .txt theo mẫu cố định (không dùng AI). Chỉ dựng dữ liệu cho form;
// việc lưu vẫn đi qua API tạo/sửa hiện có khi giáo viên bấm Lưu.
//
// Mẫu trắc nghiệm:
//   1. What time does the meeting start?
//   A. At 8:00 a.m.
//   B. At 9:00 a.m. *          ← dấu * đánh dấu đáp án đúng, hoặc dùng dòng "Đáp án: B"
//   C. At 10:00 a.m.
//   D. At 11:00 a.m.
//   Đáp án: B
//   Giải thích: ...            (tùy chọn)
//   Căn cứ: ...                (tùy chọn, Reading)
//
// Mẫu flashcard, mỗi dòng một thẻ: mặt trước | mặt sau | phát âm | loại từ | ví dụ
// Dòng bắt đầu bằng # là ghi chú và bị bỏ qua.

export const MAX_FILE_BYTES = 1024 * 1024;

const QUESTION = /^(?:câu|cau|question|q)?\s*(\d{1,3})\s*[.):]\s*(.*)$/i;
const OPTION = /^\(?([A-D])[.)]\s*(.*)$/;
const ANSWER =
  /^(?:đáp án(?: đúng)?|dap an(?: dung)?|answer|key)\s*[:：]\s*\(?([A-Za-z])\)?\.?\s*$/i;
const EXPLAIN = /^(?:giải thích|giai thich|explanation)\s*[:：]\s*(.*)$/i;
const EVIDENCE = /^(?:căn cứ|can cu|evidence)\s*[:：]\s*(.*)$/i;
const STAR = /\s*\*\s*$/;

/** Bỏ BOM, đổi xuống dòng Windows; trả về mảng [số dòng, nội dung đã trim]. */
function lines(text) {
  return String(text ?? "")
    .replace(/^﻿/, "")
    .split(/\r\n|\r|\n/)
    .map((raw, i) => [i + 1, raw.trim()]);
}

const joinText = (a, b) => (a ? `${a}\n${b}` : b);

/**
 * Tách file trắc nghiệm thành câu hỏi dạng form của McqEditor.
 * minOptions/maxOptions: Reading/Listening nhận 2–4 đáp án (Part 2 có 3), ngân hàng câu hỏi cần đúng 4.
 * Trả về { questions, errors }: câu lỗi không nằm trong questions, mỗi lỗi có số dòng.
 */
export function parseMcqText(text, { minOptions = 2, maxOptions = 4 } = {}) {
  const errors = [];
  const drafts = [];
  let cur = null;
  let last = null; // phần đang được viết tiếp khi một dòng không khớp mẫu nào

  for (const [no, line] of lines(text)) {
    if (!line || line.startsWith("#")) {
      if (!line && cur) last = null; // dòng trống kết thúc phần đang viết tiếp
      continue;
    }
    const qm = line.match(QUESTION);
    if (qm) {
      cur = { line: no, text: qm[2], options: [], answer: null, explanation: "", evidence: "" };
      drafts.push(cur);
      last = "question";
      continue;
    }
    if (!cur) {
      errors.push({
        line: no,
        message: `Chưa có câu hỏi. Dòng câu hỏi phải bắt đầu bằng số, ví dụ "1. ..."`,
      });
      continue;
    }
    const om = line.match(OPTION);
    if (om) {
      const marked = STAR.test(om[2]);
      cur.options.push({ line: no, key: om[1], text: om[2].replace(STAR, ""), marked });
      last = "option";
      continue;
    }
    const am = line.match(ANSWER);
    if (am) {
      if (cur.answer) cur.dupAnswer = no;
      cur.answer = { line: no, key: am[1].toUpperCase() };
      last = null;
      continue;
    }
    const em = line.match(EXPLAIN);
    if (em) {
      cur.explanation = em[1];
      last = "explanation";
      continue;
    }
    const vm = line.match(EVIDENCE);
    if (vm) {
      cur.evidence = vm[1];
      last = "evidence";
      continue;
    }
    if (last === "question") cur.text = joinText(cur.text, line);
    else if (last === "option") {
      const o = cur.options[cur.options.length - 1];
      o.text = joinText(o.text, line);
    } else if (last === "explanation") cur.explanation = joinText(cur.explanation, line);
    else if (last === "evidence") cur.evidence = joinText(cur.evidence, line);
    else
      errors.push({
        line: no,
        message: `Không hiểu dòng này (câu ${drafts.length}). Đáp án phải có dạng "A. ...", đáp án đúng "Đáp án: B".`,
      });
  }

  const questions = [];
  drafts.forEach((d, i) => {
    const fail = (message, line = d.line) =>
      errors.push({ line, message: `Câu ${i + 1}: ${message}` });
    const before = errors.length;
    if (!d.text.trim()) fail("thiếu nội dung câu hỏi.");
    if (d.options.length < minOptions)
      fail(`cần ít nhất ${minOptions} đáp án, file có ${d.options.length}.`);
    if (d.options.length > maxOptions)
      fail(`tối đa ${maxOptions} đáp án (A–${"ABCD"[maxOptions - 1]}).`);
    d.options.forEach((o, n) => {
      const want = "ABCD"[n];
      if (o.key !== want) fail(`đáp án thứ ${n + 1} phải là ${want}, file ghi ${o.key}.`, o.line);
      if (!o.text.trim()) fail(`đáp án ${o.key} để trống.`, o.line);
    });
    if (d.dupAnswer) fail(`có nhiều hơn một dòng "Đáp án".`, d.dupAnswer);
    const starred = d.options.filter((o) => o.marked).map((o) => o.key);
    if (starred.length > 1) fail(`đánh dấu * ở nhiều đáp án (${starred.join(", ")}).`);
    if (d.answer && !d.options.some((o) => o.key === d.answer.key))
      fail(`"Đáp án: ${d.answer.key}" không có trong các lựa chọn.`, d.answer.line);
    if (d.answer && starred.length === 1 && starred[0] !== d.answer.key)
      fail(`dấu * ở ${starred[0]} khác "Đáp án: ${d.answer.key}".`, d.answer.line);
    const key = d.answer?.key || starred[0];
    if (!key) fail(`chưa có đáp án đúng. Thêm dòng "Đáp án: B" hoặc dấu * sau đáp án đúng.`);
    if (errors.length > before) return;
    questions.push({
      line: d.line,
      questionText: d.text.trim(),
      explanation: d.explanation.trim(),
      evidence: d.evidence.trim(),
      options: d.options.map((o) => ({ optionText: o.text.trim(), correct: o.key === key })),
    });
  });
  if (!drafts.length && !errors.length)
    errors.push({ line: 1, message: "File không có câu hỏi nào." });
  errors.sort((a, b) => a.line - b.line);
  return { questions, errors };
}

const CARD_LIMITS = [
  ["frontText", "Mặt trước", 500],
  ["backText", "Mặt sau", null],
  ["pronunciation", "Phát âm", 255],
  ["wordType", "Loại từ", 100],
  ["exampleSentence", "Ví dụ", null],
];

/**
 * Mỗi dòng một thẻ: mặt trước | mặt sau | phát âm | loại từ | ví dụ.
 * Ba cột cuối có thể bỏ trống. Dán từ Excel (cách nhau bằng Tab) cũng được.
 */
export function parseFlashcardText(text) {
  const errors = [];
  const cards = [];
  for (const [no, line] of lines(text)) {
    if (!line || line.startsWith("#")) continue;
    const cols = (line.includes("|") ? line.split("|") : line.split("\t")).map((c) => c.trim());
    const before = errors.length;
    if (cols.length > CARD_LIMITS.length)
      errors.push({ line: no, message: `Có ${cols.length} cột, tối đa ${CARD_LIMITS.length}.` });
    const card = {};
    CARD_LIMITS.forEach(([key, label, max], n) => {
      card[key] = cols[n] || "";
      if (max && card[key].length > max)
        errors.push({ line: no, message: `${label} dài quá ${max} ký tự.` });
    });
    if (!card.frontText || !card.backText)
      errors.push({
        line: no,
        message: `Thiếu mặt trước hoặc mặt sau. Mẫu: "từ | nghĩa | phát âm | loại từ | ví dụ".`,
      });
    if (errors.length === before) cards.push({ line: no, ...card });
  }
  if (!cards.length && !errors.length) errors.push({ line: 1, message: "File không có thẻ nào." });
  return { cards, errors };
}

/** Thêm mục mới vào cuối; nếu form chỉ có mục trống mặc định thì thay luôn mục đó. */
export function mergeImported(current, imported, isBlank) {
  const kept = current.length === 1 && isBlank(current[0]) ? [] : current;
  return [...kept, ...imported];
}

export const isBlankQuestion = (q) =>
  !q.questionText?.trim() && (q.options || []).every((o) => !o.optionText?.trim());

export const isBlankCard = (c) => !c.frontText?.trim() && !c.backText?.trim();
