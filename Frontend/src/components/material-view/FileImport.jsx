import { useRef, useState } from "react";
import { MAX_FILE_BYTES } from "../../utils/questionImport";

/**
 * Nhập nhiều câu hỏi/thẻ từ file .txt hoặc .docx: đọc file trên trình duyệt, báo lỗi theo dòng,
 * cho xem trước rồi mới đưa vào form (hoặc lưu, với ngân hàng câu hỏi).
 * parse(text) → { items, errors: [{ line, message }] }; renderItem vẽ một mục trong bản xem trước.
 */
export default function FileImport({
  parse,
  template,
  templateName,
  renderItem,
  onImport,
  noun = "câu",
  confirmLabel = (n) => `Thêm ${n} ${noun} vào bài`,
  extra = null,
  disabled = false,
}) {
  const input = useRef(null);
  const [preview, setPreview] = useState(null);
  const [state, setState] = useState({ busy: false, error: "" });

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // chọn lại cùng file sau khi sửa vẫn kích hoạt onChange
    if (!file) return;
    setPreview(null);
    if (!/\.(txt|docx)$/i.test(file.name)) {
      setState({
        busy: false,
        error: "Chỉ nhận file .txt hoặc Word .docx. File .doc cũ chưa được hỗ trợ.",
      });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setState({ busy: false, error: "File lớn hơn 1 MB. Hãy tách thành nhiều file nhỏ." });
      return;
    }
    setState({ busy: true, error: "" });
    try {
      let text;
      if (/\.docx$/i.test(file.name)) {
        const { default: mammoth } = await import("mammoth/mammoth.browser.js");
        text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
      } else {
        text = await file.text();
      }
      if (!text.trim()) {
        throw new Error("Không tìm thấy văn bản trong file. Hãy kiểm tra file Word rồi thử lại.");
      }
      setPreview({ name: file.name, ...parse(text) });
      setState({ busy: false, error: "" });
    } catch (error) {
      setState({
        busy: false,
        error:
          error.message ||
          "Không thể đọc file. Hãy dùng file .docx hợp lệ hoặc lưu nội dung dạng UTF-8 rồi thử lại.",
      });
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([template], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = templateName;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function confirm() {
    setState({ busy: true, error: "" });
    try {
      await onImport(preview.items);
      setPreview(null);
      setState({ busy: false, error: "" });
    } catch (err) {
      setState({ busy: false, error: err.message || "Không thể nhập file" });
    }
  }

  const count = preview?.items.length || 0;
  return (
    <div className="file-import border rounded-3 p-3 my-3 bg-light">
      <div className="d-flex flex-wrap align-items-center gap-2">
        <strong className="me-auto">Nhập nhanh từ file .txt hoặc Word (.docx)</strong>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={downloadTemplate}
        >
          Tải file mẫu
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          disabled={disabled || state.busy}
          onClick={() => input.current?.click()}
        >
          {state.busy ? "Đang đọc file…" : "Chọn file…"}
        </button>
        <input
          ref={input}
          type="file"
          accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="d-none"
          aria-label="Chọn file .txt hoặc .docx để nhập"
          onChange={pick}
        />
      </div>
      {state.error && <div className="alert alert-danger mt-3 mb-0">{state.error}</div>}
      {preview && (
        <div className="mt-3">
          <p className="mb-2">
            <strong>{preview.name}</strong>: {count} {noun} hợp lệ
            {preview.errors.length > 0 && (
              <span className="text-danger">
                , {preview.errors.length} lỗi (mục lỗi sẽ bị bỏ qua)
              </span>
            )}
            .
          </p>
          {preview.errors.length > 0 && (
            <div className="alert alert-warning py-2">
              <ul className="mb-0 small">
                {preview.errors.map((e, i) => (
                  <li key={i}>
                    Dòng {e.line}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {count > 0 && (
            <ol
              className="file-import-list small mb-3"
              style={{ maxHeight: 320, overflowY: "auto" }}
            >
              {preview.items.map((item, i) => (
                <li key={i} className="mb-2">
                  {renderItem(item)}
                </li>
              ))}
            </ol>
          )}
          {extra}
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={!count || disabled || state.busy}
              onClick={confirm}
            >
              {state.busy ? "Đang nhập…" : confirmLabel(count)}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light"
              disabled={state.busy}
              onClick={() => setPreview(null)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Bản xem trước một câu trắc nghiệm: nội dung, các đáp án, đáp án đúng in đậm. */
export function McqPreview({ q }) {
  return (
    <>
      <div style={{ whiteSpace: "pre-line" }}>{q.questionText}</div>
      <ul className="list-unstyled ms-2 mb-0">
        {q.options.map((o, i) => (
          <li key={i} className={o.correct ? "fw-bold text-success" : undefined}>
            {String.fromCharCode(65 + i)}. {o.optionText}
            {o.correct && " ✓"}
          </li>
        ))}
      </ul>
      {q.explanation && <div className="text-muted">Giải thích: {q.explanation}</div>}
      {q.evidence && <div className="text-muted">Căn cứ: {q.evidence}</div>}
    </>
  );
}
