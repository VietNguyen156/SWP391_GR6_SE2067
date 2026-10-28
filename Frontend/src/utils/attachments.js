// Tệp / link đính kèm của Ngữ pháp và Reading: phân loại, nhãn, kiểm tra file trước khi tải lên.
// Luật thật nằm ở backend (đuôi + nội dung file, 20 MB, 10 tệp); ở đây chỉ báo lỗi sớm cho giáo viên.

export const MAX_ATTACHMENTS = 10;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

const EXTENSION_KIND = {
  pdf: "PDF",
  doc: "WORD",
  docx: "WORD",
  ppt: "SLIDE",
  pptx: "SLIDE",
  xls: "EXCEL",
  xlsx: "EXCEL",
  png: "IMAGE",
  jpg: "IMAGE",
  jpeg: "IMAGE",
  webp: "IMAGE",
  mp3: "AUDIO",
  m4a: "AUDIO",
  wav: "AUDIO",
  mp4: "VIDEO",
};

/** Định dạng được nhận: Ngữ pháp nhận mọi loại; Reading chỉ PDF, Word, ảnh. */
export const FILE_TYPES = {
  GRAMMAR: {
    extensions: Object.keys(EXTENSION_KIND),
    label:
      "PDF, Word, PowerPoint, Excel, ảnh (PNG, JPG, WEBP), âm thanh (MP3, M4A, WAV) hoặc video MP4",
    hint: "PDF, Word, PowerPoint, Excel, ảnh, MP3/M4A/WAV, MP4 · tối đa 20 MB mỗi file.",
  },
  READING: {
    extensions: ["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"],
    label: "PDF, Word (DOC, DOCX) hoặc ảnh (PNG, JPG, WEBP)",
    hint: "PDF, Word, ảnh PNG/JPG/WEBP · tối đa 20 MB mỗi file.",
  },
};

/** Giá trị cho thuộc tính accept của input file. */
export const acceptFor = (types = FILE_TYPES.GRAMMAR) =>
  types.extensions.map((ext) => `.${ext}`).join(",");
export const ACCEPT = acceptFor();

export const KIND_LABEL = {
  PDF: "PDF",
  WORD: "Word",
  SLIDE: "Slide",
  EXCEL: "Excel",
  IMAGE: "Ảnh",
  AUDIO: "Audio",
  VIDEO: "Video",
  YOUTUBE: "YouTube",
  LINK: "Link",
};

const extension = (name = "") => {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
};

/** Mã video YouTube trong link (watch, youtu.be, embed, shorts) hoặc null. */
export function youtubeId(url) {
  const match = String(url || "").match(
    /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&#/]|$)/,
  );
  return match ? match[1] : null;
}

/** Nhúng YouTube qua youtube-nocookie.com (không đặt cookie theo dõi trước khi bấm phát). */
export const youtubeEmbedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}`;

/** Loại hiển thị: PDF / WORD / SLIDE / EXCEL / IMAGE / AUDIO / VIDEO / YOUTUBE / LINK. */
export function attachmentKind(attachment) {
  if (attachment.kind === "LINK") return youtubeId(attachment.url) ? "YOUTUBE" : "LINK";
  return EXTENSION_KIND[extension(attachment.fileName || attachment.url)] || "LINK";
}

/** "820 KB", "3,4 MB". */
export function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Tên miền của link, bỏ "www.". */
export function linkDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Dòng phụ: dung lượng cho file, tên miền cho link. */
export const attachmentMeta = (attachment) =>
  attachment.kind === "FILE" ? formatSize(attachment.sizeBytes) : linkDomain(attachment.url);

/** Lỗi kiểm tra trước khi tải lên, hoặc "" nếu file hợp lệ. */
export function fileProblem(file, currentCount = 0, types = FILE_TYPES.GRAMMAR) {
  if (currentCount >= MAX_ATTACHMENTS) return `Đã có tối đa ${MAX_ATTACHMENTS} tài liệu đính kèm.`;
  if (!types.extensions.includes(extension(file.name)))
    return `“${file.name}” không đúng định dạng. Chỉ nhận ${types.label}.`;
  if (file.size > MAX_FILE_BYTES)
    return `“${file.name}” nặng ${formatSize(file.size)}, vượt quá 20 MB.`;
  return "";
}

/** Link hợp lệ: chỉ http/https, tối đa 1000 ký tự. Trả về lỗi hoặc "". */
export function linkProblem(url) {
  const value = String(url || "").trim();
  if (!value) return "Vui lòng nhập đường dẫn.";
  if (value.length > 1000) return "Đường dẫn tối đa 1000 ký tự.";
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return "";
  } catch {
    // rơi xuống báo lỗi
  }
  return "Đường dẫn phải bắt đầu bằng http:// hoặc https://";
}

/** Đổi chỗ phần tử index với phần tử kề (delta = -1 lên, +1 xuống); trả về mảng id mới hoặc null. */
export function movedIds(items, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return null;
  const ids = items.map((item) => item.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
}
