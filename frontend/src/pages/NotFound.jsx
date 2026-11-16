import { Link } from "react-router-dom";
import Icon from "../components/common/Icon";
import { useAuth } from "../contexts/AuthContext";
import { homeForRole } from "../utils/roleNavigation";

export default function NotFound() {
  const { user } = useAuth();
  return (
    <main className="error-page container">
      <div className="error-visual not-found">
        <Icon name="sparkle" size={45} />
        <strong>404</strong>
      </div>
      <h1>Trang bạn tìm kiếm không tồn tại</h1>
      <p>Liên kết có thể đã thay đổi hoặc nội dung không còn khả dụng.</p>
      <Link className="btn btn-primary" to={homeForRole(user?.role)}>
        <Icon name="back" size={17} /> Về trang chủ
      </Link>
    </main>
  );
}
