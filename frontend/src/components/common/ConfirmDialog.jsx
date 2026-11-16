import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";

const ConfirmContext = createContext(null);

/**
 * Hộp xác nhận thống nhất thay cho hộp confirm mặc định của trình duyệt.
 * Hiệu ứng xuất hiện và đóng mượt mà bằng Motion.
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
      <AnimatePresence>
        {request && <ConfirmDialog key="confirm-modal" {...request} onClose={close} />}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
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
    <motion.div
      className="confirm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={() => onClose(false)}
    >
      <motion.div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
      </motion.div>
    </motion.div>
  );
}
