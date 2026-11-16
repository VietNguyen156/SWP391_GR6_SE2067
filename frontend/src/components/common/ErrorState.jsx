import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { accessActions, errorTitle } from "../../utils/apiError";
import { homeForRole } from "../../utils/roleNavigation";
import Icon from "./Icon";

/**
 * Trạng thái lỗi có lối thoát: thông điệp rõ ràng + nút thử lại và/hoặc quay về.
 * error: kết quả apiError() — tự chọn tiêu đề và nút theo mã lỗi (chưa tham gia lớp, bài khóa).
 * actions: [{ label, to }] — luôn thêm "Trang chủ" của vai trò hiện tại.
 */
export default function ErrorState({ error, message, onRetry, actions = [], title }) {
  const { user } = useAuth() || {};
  const home = { label: "Trang chủ", to: homeForRole(user?.role) };
  const base = error ? accessActions(error, actions[0]).concat(actions.slice(1)) : actions;
  const links = base.some((action) => action.to === home.to) ? base : [...base, home];
  message = message || error?.message;
  title = title || errorTitle(error);
  return (
    <section className="state-block state-error" role="alert">
      <span className="state-icon" aria-hidden="true">
        <Icon name="shield" size={28} />
      </span>
      <h2>{title}</h2>
      <p>{message || "Đã có lỗi xảy ra. Vui lòng thử lại."}</p>
      <div className="state-actions">
        {links.map((action, index) => (
          <Link
            key={action.to}
            className={`btn ${index === 0 && !onRetry ? "btn-primary" : "btn-outline-secondary"}`}
            to={action.to}
          >
            {index === 0 && <Icon name="back" size={18} />} {action.label}
          </Link>
        ))}
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            <Icon name="refresh" size={18} /> Thử lại
          </button>
        )}
      </div>
    </section>
  );
}
