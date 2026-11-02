import { attachmentKind } from "../../utils/attachments";

const TAG = {
  PDF: "PDF",
  WORD: "DOC",
  SLIDE: "PPT",
  EXCEL: "XLS",
  IMAGE: "IMG",
  AUDIO: "MP3",
  VIDEO: "MP4",
  YOUTUBE: "▶",
  LINK: "URL",
};

/** Ô nhỏ ghi loại tệp (PDF, DOC, PPT…); chỉ để nhìn, loại đã có trong nhãn đọc màn hình. */
export default function AttachmentIcon({ attachment }) {
  const kind = attachmentKind(attachment);
  return (
    <span className={`ga-icon ga-icon-${kind.toLowerCase()}`} aria-hidden="true">
      {TAG[kind]}
    </span>
  );
}
