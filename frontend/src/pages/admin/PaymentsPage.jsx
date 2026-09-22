import { useEffect, useState } from "react";
import { confirmPayment, getPendingPayments } from "../../services/packageService";
export default function PaymentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => { getPendingPayments().then(setItems).catch(() => setError("Không tải được yêu cầu thanh toán.")).finally(() => setLoading(false)); }, []);
  async function confirm(item) {
    if (!window.confirm("Xác nhận đã nhận " + Number(item.amount).toLocaleString("vi-VN") + " đ từ " + item.studentEmail + "?")) return;
    setBusy(item.id); setError(""); setSuccess("");
    try {
      await confirmPayment(item.id); setItems(current => current.filter(p => p.id !== item.id)); setSuccess("Đã xác nhận thanh toán và kích hoạt gói.");
    } catch (err) { setError(err.response?.data?.message || "Không thể xác nhận thanh toán."); }
    finally { setBusy(null); }
  }
  return <><h1 className="h3">Xác nhận học phí</h1>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {success && <div role="status" className="alert alert-success">{success}</div>}
    {loading ? <p>Đang tải...</p> : items.length === 0 ? <p>Không có yêu cầu chờ xác nhận.</p> :
      <div className="table-responsive"><table className="table"><thead><tr><th>Học viên</th><th>Gói</th><th>Số tiền</th><th>Thao tác</th></tr></thead>
        <tbody>{items.map(p => <tr key={p.id}><td>{p.studentName}<br />{p.studentEmail}</td><td>{p.packageName}</td><td>{Number(p.amount).toLocaleString("vi-VN")} đ</td>
          <td><button className="btn btn-success btn-sm" disabled={busy !== null} onClick={() => confirm(p)}>{busy === p.id ? "Đang xử lý..." : "Đã nhận tiền"}</button></td></tr>)}</tbody>
      </table></div>}
  </>;
}

