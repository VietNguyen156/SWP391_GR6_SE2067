import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getPackages, purchasePackage } from "../../services/packageService";
export default function PackagesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [purchased, setPurchased] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => { getPackages().then(setItems).catch(() => setError("Không tải được gói học phí. Vui lòng tải lại trang.")).finally(() => setLoading(false)); }, []);
  async function purchase(p) {
    setBusy(p.id); setError(""); setSuccess("");
    try {
      await purchasePackage(p.id); setPurchased(current => [...current, p.id]);
      setSuccess("Đã đăng ký mua " + p.name + ". Vui lòng liên hệ mentor/admin để thanh toán và được xác nhận.");
    } catch (err) { setError(err.response?.data?.message || "Không thể đăng ký mua."); }
    finally { setBusy(null); }
  }
  return <div className="container py-5">
    <h1 className="h3">Gói học phí</h1>
    <p className="text-secondary">Chọn gói phù hợp. Gói được kích hoạt khi admin xác nhận đã nhận thanh toán.</p>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {success && <div role="status" className="alert alert-success">{success} <Link to="/user/payment">Xem đăng ký</Link></div>}
    {loading ? <p>Đang tải...</p> : items.length === 0 ? <p>Hiện chưa có gói học phí mở đăng ký.</p> : <div className="row g-4">
      {items.map(p => <div className="col-md-6 col-lg-4" key={p.id}><article className="card p-4 h-100">
        <h2 className="h4">{p.name}</h2><p className="text-secondary">Mentor: {p.mentorName}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{p.description}</p>
        <p className="fs-4 fw-bold text-primary">{Number(p.price).toLocaleString("vi-VN")} đ</p>
        <p>Thời hạn: {p.durationDays ? p.durationDays + " ngày" : "Không giới hạn"}</p>
        {!user ? <Link className="btn btn-primary mt-auto" to="/login">Đăng nhập để mua</Link> : user.role === "STUDENT" ?
          <button className="btn btn-primary mt-auto" disabled={busy !== null || purchased.includes(p.id)} onClick={() => purchase(p)}>
            {busy === p.id ? "Đang đăng ký..." : purchased.includes(p.id) ? "Đã đăng ký" : "Đăng ký mua"}
          </button> : <p className="small text-secondary">Dành cho tài khoản học viên</p>}
      </article></div>)}
    </div>}
  </div>;
}

