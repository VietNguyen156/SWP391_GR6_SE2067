import { useEffect, useId, useRef, useState } from "react";
import AudioPlayer from "../common/AudioPlayer";
import Icon from "../common/Icon";
import AttachmentIcon from "./AttachmentIcon";
import { grammarApi } from "../../services/learningContentService";
import {
  KIND_LABEL,
  attachmentKind,
  attachmentMeta,
  linkDomain,
  youtubeEmbedUrl,
  youtubeId,
} from "../../utils/attachments";

const isPhone = () => window.matchMedia?.("(max-width: 767.98px)").matches;

/** Tải tệp (có token) thành object URL; tự thu hồi khi rời trang. */
function useBlobUrl(api, id, enabled, validatePdf = false) {
  const [state, setState] = useState({ url: "", error: "" });
  useEffect(() => {
    if (!enabled) {
      setState({ url: "", error: "" });
      return undefined;
    }
    let url = "";
    let alive = true;
    api
      .attachmentBlob(id, validatePdf ? "pdf" : "file")
      .then(async (blob) => {
        if (!alive) return;
        url = URL.createObjectURL(blob);
        setState({ url, error: "" });
      })
      .catch(
        (error) =>
          alive &&
          setState({
            url: "",
            error: error.message || "Không thể tải tài liệu. Vui lòng thử lại sau.",
          }),
      );
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, id, enabled]);
  return state;
}

async function download(api, item) {
  const url = URL.createObjectURL(
    await api.attachmentBlob(
      item.id,
      attachmentKind(item) === "PDF" ? "pdf" : attachmentKind(item) === "AUDIO" ? "audio" : "file",
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = item.fileName || item.title;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function DownloadButton({ api, item, primary = false }) {
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  async function run() {
    setState("busy");
    setError("");
    try {
      await download(api, item);
      setState("");
    } catch (e) {
      setState("error");
      setError(e.message || "Không thể tải tệp.");
    }
  }
  return (
    <>
      <button
        type="button"
        className={`btn btn-sm ${primary ? "btn-primary" : "btn-outline-primary"}`}
        onClick={run}
        disabled={state === "busy"}
      >
        <Icon name="save" size={15} />
        {state === "busy" ? "Đang tải…" : state === "error" ? "Thử lại" : "Tải về"}
      </button>
      {error && (
        <span role="alert" className="text-danger small ms-2">
          {error}
        </span>
      )}
    </>
  );
}

function PdfItem({ api, item, startOpen }) {
  const [open, setOpen] = useState(startOpen && !isPhone());
  const [mobileError, setMobileError] = useState("");
  const { url, error } = useBlobUrl(api, item.id, open, true);
  async function view() {
    if (!isPhone()) return setOpen((v) => !v);
    // Điện thoại: mở tab mới (mở trước khi chờ tải để trình duyệt không chặn cửa sổ bật lên).
    const tab = window.open("", "_blank");
    try {
      const blob = await api.attachmentBlob(item.id, "pdf");
      const blobUrl = URL.createObjectURL(blob);
      if (tab) tab.location.href = blobUrl;
      else window.location.href = blobUrl;
    } catch (error) {
      tab?.close();
      setMobileError(error.message || "Không thể mở tệp PDF. Vui lòng báo giáo viên kiểm tra tệp.");
    }
  }
  return (
    <>
      <div className="ga-actions">
        <button type="button" className="btn btn-sm btn-primary" onClick={view}>
          <Icon name={open ? "eyeOff" : "eye"} size={15} /> {open ? "Đóng" : "Xem"}
        </button>
        <DownloadButton api={api} item={item} />
      </div>
      {open &&
        (url ? (
          <iframe className="ga-pdf" src={`${url}#navpanes=0&view=FitH`} title={item.title} />
        ) : (
          <p className="ga-loading" role={error ? "alert" : undefined}>
            {error || "Đang mở PDF…"}
          </p>
        ))}
      {mobileError && (
        <p className="ga-loading" role="alert">
          {mobileError}
        </p>
      )}
    </>
  );
}

function ImageItem({ api, item }) {
  const { url, error } = useBlobUrl(api, item.id, true);
  const dialog = useRef(null);
  if (error) return <p className="ga-loading">{error}</p>;
  if (!url) return <p className="ga-loading">Đang tải ảnh…</p>;
  return (
    <>
      <button
        type="button"
        className="ga-thumb"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Phóng to ảnh “${item.title}”`}
      >
        <img src={url} alt={item.title} />
      </button>
      <dialog
        ref={dialog}
        className="ga-lightbox"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      >
        <img src={url} alt={item.title} />
        <button
          type="button"
          className="btn btn-light ga-lightbox-close"
          onClick={() => dialog.current?.close()}
          aria-label="Đóng ảnh"
        >
          <Icon name="close" size={18} />
        </button>
      </dialog>
    </>
  );
}

function VideoItem({ api, item }) {
  const [load, setLoad] = useState(false);
  const { url, error } = useBlobUrl(api, item.id, load);
  if (!load)
    return (
      <button type="button" className="btn btn-sm btn-primary" onClick={() => setLoad(true)}>
        <Icon name="play" size={15} /> Phát video
      </button>
    );
  if (!url) return <p className="ga-loading">{error || "Đang tải video…"}</p>;
  return <video className="ga-video" src={url} controls autoPlay preload="metadata" />;
}

function Body({ api, item, kind, pdfOpen }) {
  switch (kind) {
    case "PDF":
      return <PdfItem api={api} item={item} startOpen={pdfOpen} />;
    case "IMAGE":
      return <ImageItem api={api} item={item} />;
    case "AUDIO":
      return <AudioPlayer endpoint={`/grammar/attachments/${item.id}/file`} className="w-100" />;
    case "VIDEO":
      return <VideoItem api={api} item={item} />;
    case "YOUTUBE":
      return (
        <div className="ga-embed">
          <iframe
            src={youtubeEmbedUrl(youtubeId(item.url))}
            title={item.title}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      );
    case "LINK":
      return null;
    default:
      return (
        <div className="ga-actions">
          <DownloadButton api={api} item={item} primary />
        </div>
      );
  }
}

/**
 * "Tài liệu & liên kết" ngay dưới một phần giải thích Ngữ pháp; không có tệp nào thì ẩn.
 * Reading: api = readingApi, pdfOpen = mở sẵn PDF (trên máy tính), title = tiêu đề khối.
 */
export default function AttachmentList({
  attachments = [],
  api = grammarApi,
  pdfOpen = false,
  title = "Tài liệu & liên kết",
}) {
  const titleId = useId();
  if (!attachments.length) return null;
  return (
    <section className="ga-list" aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      <ul>
        {attachments.map((item) => {
          const kind = attachmentKind(item);
          const head = (
            <>
              <AttachmentIcon attachment={item} />
              <span className="ga-item-text">
                <span className="ga-item-title">{item.title}</span>
                <span className="ga-meta">
                  {KIND_LABEL[kind]} · {attachmentMeta(item)}
                </span>
              </span>
            </>
          );
          return (
            <li className={`ga-item is-${kind.toLowerCase()}`} key={item.id}>
              {kind === "LINK" ? (
                <a
                  className="ga-item-head ga-link"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {head}
                  <span className="ga-external">
                    Mở {linkDomain(item.url)} <span aria-hidden="true">↗</span>
                  </span>
                </a>
              ) : (
                <div className="ga-item-head">{head}</div>
              )}
              <Body api={api} item={item} kind={kind} pdfOpen={pdfOpen} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
