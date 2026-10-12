import { useSearchParams } from "react-router-dom";
import { returnLabel, safeReturnTo } from "./returnTo";

/** { to, label } của nơi giáo viên đã đi vào trang soạn thảo; mặc định là trang danh sách. */
export function useReturnTo(fallbackPath, fallbackLabel) {
  const [params] = useSearchParams();
  const to = safeReturnTo(params.get("returnTo"), fallbackPath);
  return { to, label: to === fallbackPath ? fallbackLabel : returnLabel(to, fallbackLabel) };
}
