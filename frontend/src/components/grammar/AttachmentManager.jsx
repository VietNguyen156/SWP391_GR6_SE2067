import { useEffect, useId, useRef, useState } from "react";
import Icon from "../common/Icon";
import { useConfirm } from "../common/ConfirmDialog";
import AttachmentIcon from "./AttachmentIcon";
import { grammarApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";
import {
  FILE_TYPES,
  KIND_LABEL,
  acceptFor,
  MAX_ATTACHMENTS,
  attachmentKind,
  attachmentMeta,
  fileProblem,
  linkProblem,
  movedIds,
} from "../../utils/attachments";

const errorText = (error, fallback) => apiError(error, fallback).message || fallback;

/**
 * "Tài liệu đính kèm" trong editor Ngữ pháp: tải file (kéo thả, có tiến trình), thêm link, sửa tiêu đề
 * tại chỗ, ↑↓ đổi thứ tự, xóa. Là một mục trong form giải thích: mỗi phần giải thích (contentId) có danh
 * sách tài liệu riêng. Chưa có contentId (đang thêm giải thích mới) = giữ tạm trên máy; trang cha tải lên
 * sau khi lưu phần giải thích (xem uploadDrafts).
 * label: tên vùng cho trình đọc màn hình (phân biệt các phần trên cùng trang).
 * api / types / allowLinks: Reading dùng readingApi, chỉ PDF-Word-ảnh và không có link.
 */
export default function AttachmentManager({
  contentId,
  attachments = [],
  onChange,
  embedded = false,
  label = "Tài liệu đính kèm",
  api = grammarApi,
  types = FILE_TYPES.GRAMMAR,
  allowLinks = true,
  heading = "Tài liệu đính kèm",
}) {
  // embedded: nằm ngay dưới phần giải thích của trang sửa nội dung, không có khung riêng.
  const frame = embedded ? "ga-manager ga-embedded" : "teacher-panel p-4 mb-4 ga-manager";
  const titleId = useId();
  const confirm = useConfirm();
  const input = useRef(null);
  const [items, setItems] = useState(attachments);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState(null);

  const uploading = useRef(false);
  const report = useRef(onChange);
  report.current = onChange;

  useEffect(() => setItems(attachments), [attachments]);
  // Báo danh sách mới lên trang cha sau mỗi thay đổi (cập nhật theo trạng thái mới nhất, không theo closure cũ).
  useEffect(() => report.current?.(items), [items]);

  const draft = !contentId;
  const full = items.length >= MAX_ATTACHMENTS;
  const commit = setItems;

  async function upload(files) {
    // Một lượt tải tại một thời điểm; các file trong lượt tải lên lần lượt.
    if (uploading.current) return;
    uploading.current = true;
    setError("");
    let count = items.length;
    for (const file of files) {
      const problem = fileProblem(file, count, types);
      if (problem) {
        setError(problem);
        break;
      }
      if (draft) {
        count += 1;
        commit((current) => [...current, draftFile(file)]);
        continue;
      }
      setProgress(0);
      try {
        const saved = await api.uploadAttachment(contentId, file, "", setProgress);
        count += 1;
        commit((current) => [...current, saved]);
      } catch (e) {
        setError(errorText(e, `Không thể tải lên “${file.name}”.`));
        break;
      } finally {
        setProgress(null);
      }
    }
    uploading.current = false;
    if (input.current) input.current.value = "";
  }

  async function addLink() {
    const problem = linkProblem(link.url);
    if (problem) return setError(problem);
    if (draft) {
      commit((current) => [...current, draftLink(link.title, link.url.trim())]);
      setLink(null);
      setError("");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await grammarApi.addLink(contentId, {
        title: link.title,
        url: link.url.trim(),
      });
      commit((current) => [...current, saved]);
      setLink(null);
    } catch (e) {
      setError(errorText(e, "Không thể thêm link."));
    } finally {
      setBusy(false);
    }
  }

  async function rename(item, title) {
    const value = title.trim();
    if (!value || value === item.title) return;
    if (draft)
      return commit((current) =>
        current.map((x) => (x.id === item.id ? { ...x, title: value } : x)),
      );
    try {
      const saved = await api.updateAttachment(item.id, { title: value });
      commit((current) => current.map((x) => (x.id === item.id ? saved : x)));
    } catch (e) {
      setError(errorText(e, "Không thể đổi tiêu đề."));
    }
  }

  async function move(index, delta) {
    const ids = movedIds(items, index, delta);
    if (!ids) return;
    const before = items;
    commit(ids.map((id) => items.find((x) => x.id === id)));
    if (draft) return;
    try {
      await api.reorderAttachments(contentId, ids);
    } catch (e) {
      commit(before);
      setError(errorText(e, "Không thể đổi thứ tự."));
    }
  }

  async function remove(item) {
    if (draft) return commit((current) => current.filter((x) => x.id !== item.id));
    const ok = await confirm({
      title: "Xóa tài liệu",
      message: `Xóa “${item.title}”? Học viên sẽ không còn thấy tài liệu này.`,
      confirmLabel: "Xóa",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteAttachment(item.id);
      commit((current) => current.filter((x) => x.id !== item.id));
    } catch (e) {
      setError(errorText(e, "Không thể xóa tài liệu."));
    }
  }

  function drop(event) {
    event.preventDefault();
    setDragging(false);
    if (!full && progress === null) upload([...event.dataTransfer.files]);
  }

  return (
    <section className={frame} aria-label={label}>
      <div className="ga-manager-head">
        <h2 id={titleId} className={embedded ? "h6 fw-bold mb-0" : "h5 fw-bold mb-0"}>
          {heading}
        </h2>
        <span className="ga-count">
          {items.length}/{MAX_ATTACHMENTS}
        </span>
      </div>

      {items.length > 0 && (
        <ol className="ga-rows">
          {items.map((item, index) => (
            <li className="ga-row" key={item.id}>
              <AttachmentIcon attachment={item} />
              <div className="ga-row-main">
                <input
                  className="ga-title-input"
                  defaultValue={item.title}
                  key={item.title}
                  maxLength={200}
                  aria-label={`Tiêu đề ${KIND_LABEL[attachmentKind(item)]} ${index + 1}`}
                  onBlur={(e) => rename(item, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") {
                      e.currentTarget.value = item.title;
                      e.currentTarget.blur();
                    }
                  }}
                />
                <span className="ga-meta">
                  {KIND_LABEL[attachmentKind(item)]} · {attachmentMeta(item)}
                </span>
              </div>
              <div className="ga-row-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Đưa “${item.title}” lên`}
                >
                  <Icon name="up" size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Đưa “${item.title}” xuống`}
                >
                  <Icon name="down" size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light ga-delete"
                  onClick={() => remove(item)}
                  aria-label={`Xóa “${item.title}”`}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {error}
        </div>
      )}

      {full ? (
        <p className="ga-note">Đã đủ {MAX_ATTACHMENTS} tài liệu. Xóa bớt để thêm mới.</p>
      ) : (
        <>
          <div
            className={`ga-drop ${dragging ? "is-dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
          >
            {progress !== null ? (
              <div className="ga-progress" role="status">
                <span>Đang tải lên… {progress}%</span>
                <div
                  className="ga-progress-track"
                  role="progressbar"
                  aria-label="Tiến trình tải lên"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <Icon name="upload" size={20} />
                <span>Kéo thả file vào đây hoặc</span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => input.current?.click()}
                >
                  Tải file lên
                </button>
                {allowLinks && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setLink({ title: "", url: "" })}
                    disabled={link !== null}
                  >
                    Thêm link
                  </button>
                )}
              </>
            )}
            <input
              ref={input}
              type="file"
              accept={acceptFor(types)}
              multiple
              hidden
              data-testid="attachment-file"
              onChange={(e) => upload([...e.target.files])}
            />
          </div>
          <p className="ga-hint">{types.hint}</p>
        </>
      )}

      {link && (
        // Không dùng <form>: mục này nằm bên trong form giải thích (form không lồng form).
        <div className="ga-link-form">
          <label>
            <span>Tiêu đề</span>
            <input
              className="form-control"
              maxLength={200}
              value={link.title}
              placeholder="Để trống sẽ dùng tên miền"
              onChange={(e) => setLink({ ...link, title: e.target.value })}
            />
          </label>
          <label>
            <span>Đường dẫn (URL)</span>
            <input
              className="form-control"
              type="url"
              maxLength={1000}
              value={link.url}
              placeholder="https://"
              onChange={(e) => setLink({ ...link, url: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                addLink();
              }}
            />
          </label>
          <div className="ga-link-actions">
            <button type="button" className="btn btn-link" onClick={() => setLink(null)}>
              Hủy
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={addLink}>
              {busy ? "Đang thêm…" : "Thêm link"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

let draftSeq = 0;
const draftFile = (file) => ({
  id: `draft-${++draftSeq}`,
  kind: "FILE",
  title: file.name,
  fileName: file.name,
  sizeBytes: file.size,
  file,
});
const draftLink = (title, url) => ({
  id: `draft-${++draftSeq}`,
  kind: "LINK",
  title: title?.trim() || new URL(url).hostname,
  url,
});

/** Tải các tài liệu giữ tạm lên phần vừa lưu. Trả về tên các tài liệu không tải được. */
export async function uploadDrafts(contentId, drafts, api = grammarApi) {
  const failed = [];
  for (const item of drafts) {
    try {
      if (item.kind === "FILE") await api.uploadAttachment(contentId, item.file, item.title);
      else await api.addLink(contentId, { title: item.title, url: item.url });
    } catch {
      failed.push(item.title);
    }
  }
  return failed;
}
