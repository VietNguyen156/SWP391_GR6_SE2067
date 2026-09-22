import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubscriptions } from "../../services/packageService";
export default function PaymentPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getSubscriptions().then(setItems).catch(() => setError("Không tải được đăng ký. Vui lòng tải lại trang.")).finally(() => setLoading(false)); }, []);
  const status = s => s.status === "ACTIVE" && s.endAt && new Date(s.endAt) <= new Date() ? "Đã hết hạn" :
    ({ PENDING: "Chờ xác nhận thanh toán", ACTIVE: "Đang sử dụng", EXPIRED: "Đã hết hạn", CANCELLED: "Đã hủy" }[s.status] || s.status);
  return <div className="container py-5"><h1 className="h3">Gói đã đăng ký</h1>
    <p>Liên hệ mentor/admin để nhận hướng dẫn thanh toán. Sau khi nhận tiền, admin xác nhận để kích hoạt gói.</p>
    <Link className="btn btn-outline-primary mb-3" to="/packages">Xem gói học phí</Link>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {loading ? <p>Đang tải...</p> : items.length === 0 ? <p>Bạn chưa đăng ký gói nào.</p> :
      <div className="table-responsive"><table className="table"><thead><tr><th>Mã đăng ký</th><th>Gói</th><th>Học phí</th><th>Trạng thái</th><th>Hết hạn</th></tr></thead>
        <tbody>{items.map(s => <tr key={s.id}><td>#{s.id}</td><td>{s.packageName}</td><td>{Number(s.amount).toLocaleString("vi-VN")} đ</td><td>{status(s)}</td><td>{s.endAt ? new Date(s.endAt).toLocaleDateString("vi-VN") : "—"}</td></tr>)}</tbody>
      </table></div>}
  </div>;
}
