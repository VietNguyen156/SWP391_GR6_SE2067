// Transcript bài nghe: mỗi dòng "[W-US] câu nói {1}" — mã giọng (M/W + US/UK/AU/CA) và dấu {n} câu hỏi.

const ACCENTS = { US: "Mỹ", UK: "Anh", AU: "Úc", CA: "Canada" };

/** Nhãn người nói: "W-US" → "Nữ · Mỹ". */
export function speakerLabel(code) {
  const match = /^([MW])-(US|UK|AU|CA)$/.exec(code || "");
  if (!match) return "";
  return `${match[1] === "M" ? "Nam" : "Nữ"} · ${ACCENTS[match[2]]}`;
}

/** Tách transcript thành [{ speaker, text, questions }]; dòng không có mã giọng giữ nguyên chữ. */
export function parseTranscript(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tagged = /^\[([MW]-(?:US|UK|AU|CA))\]\s*(.*)$/.exec(line);
      const body = tagged ? tagged[2] : line;
      const questions = [...body.matchAll(/\{(\d+(?:\s*,\s*\d+)*)\}/g)].flatMap((m) =>
        m[1].split(",").map((n) => Number(n.trim())),
      );
      return {
        speaker: tagged ? tagged[1] : null,
        text: body.replace(/\s*\{\d+(?:\s*,\s*\d+)*\}/g, "").trim(),
        questions,
      };
    });
}
