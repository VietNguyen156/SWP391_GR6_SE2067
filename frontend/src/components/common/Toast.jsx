import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Icon from "./Icon";

const ToastContext = createContext(null);

/** Thông báo ngắn thống nhất: toast.success("Đã lưu"), toast.error("Không thể lưu"). */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const nextId = useRef(1);
  const dismiss = useCallback(
    (id) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const push = useCallback(
    (tone, message) => {
      if (!message) return;
      const id = nextId.current++;
      setItems((current) => [...current.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
    },
    [dismiss],
  );
  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((item) => (
          <div className={`app-toast is-${item.tone}`} key={item.id}>
            <Icon
              name={
                item.tone === "success" ? "check" : item.tone === "error" ? "shield" : "sparkle"
              }
              size={18}
            />
            <span>{item.message}</span>
            <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(item.id)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const noop = { success: () => {}, error: () => {}, info: () => {} };
export function useToast() {
  return useContext(ToastContext) || noop;
}

/** Hiện toast mỗi khi `message` đổi sang giá trị mới (dùng cho state.message sẵn có của trang). */
export function useSuccessToast(message) {
  const toast = useToast();
  useEffect(() => {
    if (message) toast.success(message);
  }, [message, toast]);
}
