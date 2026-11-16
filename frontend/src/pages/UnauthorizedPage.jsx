import { Link } from "react-router-dom";
import Icon from "../components/common/Icon";
import { useAuth } from "../contexts/AuthContext";
import { homeForRole } from "../utils/roleNavigation";

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <main className="error-page container">
      <div className="error-visual">
        <Icon name="shield" size={45} />
        <strong>403</strong>
      </div>
      <h1>Bạn không có quyền truy cập</h1>
      <p>Tài khoản hiện tại không được phép mở trang này.</p>
      <Link className="btn btn-primary" to={homeForRole(user?.role)}>
        <Icon name="back" size={17} /> Về trang chủ
      </Link>
    </main>
  );
}
