import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../components/common/ConfirmDialog";

/**
 * Có thay đổi chưa lưu: hỏi trước khi rời trang qua link trong app (kể cả nút Hủy) và khi tải lại /
 * đóng tab. Trả về `release()`: gọi ngay trước khi tự chuyển trang sau khi lưu thành công.
 *
 * ponytail: BrowserRouter không chặn được nút Back của trình duyệt; chuyển sang data router
 * (createBrowserRouter + useBlocker) nếu cần chặn cả trường hợp đó.
 */
export default function useUnsavedGuard(dirty) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const state = useRef({ dirty, released: false });
  state.current.dirty = dirty;

  useEffect(() => {
    const blocking = () => state.current.dirty && !state.current.released;
    function onBeforeUnload(event) {
      if (!blocking()) return;
      event.preventDefault();
      event.returnValue = "";
    }
    async function onClick(event) {
      if (!blocking() || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      // Bắt ở pha capture trên document: chặn trước khi Link của React Router kịp chuyển trang.
      event.preventDefault();
      event.stopPropagation();
      const ok = await confirm({
        title: "Rời trang khi chưa lưu?",
        message: "Các thay đổi chưa lưu sẽ mất.",
        confirmLabel: "Rời trang",
        danger: true,
      });
      if (!ok) return;
      state.current.released = true;
      navigate(`${url.pathname}${url.search}${url.hash}`);
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [confirm, navigate]);

  return () => {
    state.current.released = true;
  };
}
