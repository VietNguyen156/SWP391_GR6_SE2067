const QUESTION_LINE = /^\s*(\d+)[.)]\s*(.+?)\s*$/;
const OPTION_LINE = /^\s*([A-D])[.)]\s*(.*?)\s*$/i;
const ANSWER_LINE = /^\s*(?:đáp\s*án|answer)\s*:\s*([A-D])\s*$/i;

function addError(errors, line, message) {
  errors.push(`Dòng ${line}: ${message}`);
}

export function parseReadingQuestionText(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/);
  const blocks = [];
  let current = null;
  const errors = [];

  lines.forEach((raw, index) => {
    const lineNumber = index + 1;
    const value = raw.trim();
    if (!value) return;

    const questionMatch = value.match(QUESTION_LINE);
    if (questionMatch) {
      if (current) blocks.push(current);
      current = {
        line: lineNumber,
        number: questionMatch[1],
        questionText: questionMatch[2].trim(),
        options: new Map(),
        answer: null,
      };
      return;
    }

    if (!current) {
      addError(errors, lineNumber, "Nội dung phải bắt đầu bằng số câu, ví dụ: 1. Câu hỏi");
      return;
    }

    const optionMatch = value.match(OPTION_LINE);
    if (optionMatch) {
      const label = optionMatch[1].toUpperCase();
      if (current.options.has(label)) {
        addError(errors, lineNumber, `Câu ${current.number}: đáp án ${label} bị lặp.`);
      } else if (!optionMatch[2].trim()) {
        addError(errors, lineNumber, `Câu ${current.number}: nội dung đáp án ${label} đang trống.`);
      } else {
        current.options.set(label, { text: optionMatch[2].trim(), line: lineNumber });
      }
      return;
    }

    const answerMatch = value.match(ANSWER_LINE);
    if (answerMatch) {
      if (current.answer) {
        addError(errors, lineNumber, `Câu ${current.number}: chỉ được có một dòng đáp án đúng.`);
      } else {
        current.answer = { label: answerMatch[1].toUpperCase(), line: lineNumber };
      }
      return;
    }

    addError(
      errors,
      lineNumber,
      `Không nhận diện được dòng này. Dùng A. Nội dung hoặc Đáp án: B (câu hỏi phải nằm trên một dòng).`,
    );
  });

  if (current) blocks.push(current);

  const questions = blocks.map((block) => {
    for (const label of ["A", "B", "C", "D"]) {
      if (!block.options.has(label)) {
        addError(errors, block.line, `Câu ${block.number}: thiếu đáp án ${label}.`);
      }
    }
    for (const [label, option] of block.options) {
      if (!["A", "B", "C", "D"].includes(label)) {
        addError(errors, option.line, `Câu ${block.number}: chỉ hỗ trợ các lựa chọn A, B, C, D.`);
      }
    }
    if (!block.answer) {
      addError(errors, block.line, `Câu ${block.number}: thiếu dòng Đáp án: A/B/C/D.`);
    } else if (!block.options.has(block.answer.label)) {
      addError(
        errors,
        block.answer.line,
        `Câu ${block.number}: đáp án đúng ${block.answer.label} chưa có nội dung lựa chọn.`,
      );
    }

    return {
      questionText: block.questionText,
      explanation: "",
      evidence: "",
      options: ["A", "B", "C", "D"].map((label) => ({
        optionText: block.options.get(label)?.text || "",
        correct: block.answer?.label === label,
      })),
    };
  });

  if (!questions.length && !errors.length) {
    addError(errors, 1, "File chưa có câu hỏi nào.");
  }

  return { questions, errors };
}
