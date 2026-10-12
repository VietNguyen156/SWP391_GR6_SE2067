import { useEffect, useState } from "react";
import { apiError } from "./apiError";

/**
 * Nạp dữ liệu cho trang tạo/sửa. `load()` trả về { form, ...phụ } chỉ sau khi đã có đủ dữ liệu
 * chính lẫn các danh sách phụ thuộc (khóa, tuần, bài...), nên form được đổ đúng MỘT lần và không
 * bao giờ hiện trống ở chế độ sửa. Lỗi (403/404...) → status "error", trang không hiện form.
 */
export default function useEditForm(load, deps) {
  const [state, setState] = useState({ status: "loading", form: null, extra: {}, error: null });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, status: "loading", error: null }));
    load()
      .then(
        ({ form, ...extra }) => active && setState({ status: "ready", form, extra, error: null }),
      )
      .catch(
        (error) =>
          active &&
          setState({
            status: "error",
            form: null,
            extra: {},
            error: apiError(error, "Không thể tải dữ liệu"),
          }),
      );
    return () => {
      active = false;
    };
  }, deps);

  function setForm(next) {
    setState((current) => ({
      ...current,
      form: typeof next === "function" ? next(current.form) : next,
    }));
  }
  function setExtra(patch) {
    setState((current) => ({ ...current, extra: { ...current.extra, ...patch } }));
  }

  return { ...state, ready: state.status === "ready", setForm, setExtra };
}
