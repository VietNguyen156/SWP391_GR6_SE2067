// Markdown giới hạn cho đoạn văn Reading: tiêu đề (#, ##, ###), đoạn văn, xuống dòng, **đậm**,
// *nghiêng* / _nghiêng_, danh sách (- / * / 1.), bảng đơn giản (| a | b | + dòng |---|).
// Chỉ tạo cấu trúc dữ liệu; React render thành phần tử nên mọi HTML trong bài đều hiện như chữ.

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

/** "**a** and *b*" → [{text:"a",bold:true},{text:" and "},{text:"b",italic:true}]. */
export function parseInline(text) {
  const out = [];
  const pattern = /\*\*(.+?)\*\*|\*(?!\s)(.+?)\*|(?<![A-Za-z0-9])_(?!\s)(.+?)_(?![A-Za-z0-9])/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], bold: true });
    else out.push({ text: m[2] ?? m[3], italic: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

const cells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => parseInline(c.trim()));

/** Chuỗi Markdown → danh sách khối { type, ... } với nội dung inline đã tách. */
export function parseMarkdown(source = "", format = "MARKDOWN") {
  const lines = String(source).replace(/\r\n?/g, "\n").split("\n");
  if (format === "PLAIN") {
    return String(source)
      .replace(/\r\n?/g, "\n")
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => ({ type: "p", inline: [{ text: p.trim() }] }));
  }
  const blocks = [];
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", inline: parseInline(para.join("\n")) });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      flush();
      blocks.push({ type: "h", level: heading[1].length, inline: parseInline(heading[2].trim()) });
      continue;
    }
    if (TABLE_ROW.test(line) && TABLE_RULE.test(lines[i + 1] || "")) {
      flush();
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(cells(lines[i++]));
      i--;
      blocks.push({ type: "table", head, rows });
      continue;
    }
    const bullet = line.match(BULLET);
    const numbered = !bullet && line.match(NUMBERED);
    if (bullet || numbered) {
      flush();
      const ordered = Boolean(numbered);
      const re = ordered ? NUMBERED : BULLET;
      const items = [];
      while (i < lines.length && re.test(lines[i]))
        items.push(parseInline(lines[i++].match(re)[1]));
      i--;
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return blocks;
}

/**
 * Tách bài đọc nhiều văn bản (DOUBLE / TRIPLE) theo tiêu đề cấp cao nhất có trong bài.
 * Phần trước tiêu đề đầu tiên gộp vào văn bản 1. Không có tiêu đề → một văn bản.
 */
export function splitDocuments(blocks) {
  const headings = blocks.filter((b) => b.type === "h");
  if (!headings.length) return [blocks];
  const top = Math.min(...headings.map((h) => h.level));
  const docs = [];
  for (const block of blocks) {
    if ((block.type === "h" && block.level === top) || !docs.length) docs.push([]);
    docs[docs.length - 1].push(block);
  }
  // Phần mở đầu (không có tiêu đề) đứng trước văn bản có tiêu đề đầu tiên → gộp làm một.
  if (docs.length > 1 && docs[0][0]?.type !== "h") docs.splice(0, 2, [...docs[0], ...docs[1]]);
  return docs;
}

/**
 * Đánh dấu các đoạn trích (evidence) trong một dãy inline: tìm trên chữ thuần của cả khối nên
 * đoạn trích có thể đi qua chỗ **đậm**. Trả về dãy mới, phần khớp có mark = vị trí đoạn trích.
 */
export function markInline(inline, needles = []) {
  const plain = inline.map((s) => s.text).join("");
  const ranges = [];
  needles.forEach((needle, index) => {
    const value = (needle || "").trim();
    if (!value) return;
    const at = plain.indexOf(value);
    if (at >= 0) ranges.push({ start: at, end: at + value.length, index });
  });
  if (!ranges.length) return inline;
  const markAt = (pos) => ranges.find((r) => pos >= r.start && pos < r.end);
  const cuts = new Set([0, plain.length]);
  ranges.forEach((r) => cuts.add(r.start).add(r.end));
  const out = [];
  let offset = 0;
  for (const seg of inline) {
    const end = offset + seg.text.length;
    const points = [...cuts].filter((c) => c > offset && c < end).sort((a, b) => a - b);
    let from = offset;
    for (const to of [...points, end]) {
      if (to > from) {
        const hit = markAt(from);
        out.push({ ...seg, text: plain.slice(from, to), ...(hit ? { mark: hit.index } : {}) });
      }
      from = to;
    }
    offset = end;
  }
  return out;
}

/** Chữ thuần của toàn bài (để kiểm tra đoạn trích có nằm nguyên văn trong bài). */
export const plainText = (blocks) =>
  blocks
    .flatMap((b) =>
      b.type === "list" ? b.items : b.type === "table" ? [b.head, ...b.rows].flat() : [b.inline],
    )
    .map((inline) => inline.map((s) => s.text).join(""))
    .join("\n");
