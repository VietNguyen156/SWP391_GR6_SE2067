import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const ConfirmContext = createContext(null);

/**
 * Hộp xác nhận thống nhất thay cho hộp confirm mặc định của trình duyệt.
 * const confirm = useConfirm(); if (!(await confirm({ title, message, confirmLabel, danger }))) return;
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({ ...(typeof options === "string" ? { message: options } : options), resolve });
      }),
    [],
  );
  function close(result) {
    request?.resolve(result);
    setRequest(null);
  }
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && <ConfirmDialog {...request} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  // App luôn bọc ConfirmProvider; ngoài provider thì mặc định không xác nhận (an toàn cho thao tác xóa).
  return confirm || (() => Promise.resolve(false));
}

function ConfirmDialog({
  title = "Xác nhận",
  message,
  confirmLabel = "Đồng ý",
  cancelLabel = "Hủy",
  danger = false,
  onClose,
}) {
  const confirmRef = useRef(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (event) => event.key === "Escape" && onClose(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="confirm-backdrop" onMouseDown={() => onClose(false)}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className={`confirm-icon ${danger ? "is-danger" : ""}`} aria-hidden="true">
          <Icon name={danger ? "trash" : "question"} size={22} />
        </span>
        <h2 id="confirm-title">{title}</h2>
        {message && <p id="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => onClose(false)}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
