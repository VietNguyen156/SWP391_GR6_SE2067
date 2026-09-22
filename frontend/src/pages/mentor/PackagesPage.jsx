import { useEffect, useState } from "react";
import { createPackage, getMentorPackages } from "../../services/packageService";
const initial = { name: "", description: "", price: "", durationDays: 30 };
export default function PackagesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => { getMentorPackages().then(setItems).catch(() => setError("Không tải được gói học phí. Vui lòng tải lại trang.")).finally(() => setLoading(false)); }, []);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const item = await createPackage({ ...form, price: Number(form.price), durationDays: Number(form.durationDays) });
      setItems(current => [item, ...current]); setForm(initial); setSuccess("Đã tạo gói học phí. Học viên có thể đăng ký mua ngay.");
    } catch (err) { setError(err.response?.data?.message || "Không thể tạo gói học phí."); }
    finally { setSaving(false); }
  }
  return <>
    <h2 className="h4">Gói học phí của bạn</h2>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {success && <div role="status" className="alert alert-success">{success}</div>}
    <form onSubmit={submit} className="card p-4 my-3">
      <h3 className="h5">Tạo gói học phí</h3>
      <label className="form-label">Tên gói<input className="form-control" name="name" value={form.name} onChange={change} required maxLength={180} /></label>
      <label className="form-label">Mô tả<textarea className="form-control" name="description" value={form.description} onChange={change} maxLength={10000} /></label>
      <div className="row">
        <label className="col-md-6 form-label">Học phí (VNĐ)<input className="form-control" type="number" name="price" value={form.price} onChange={change} min="0" max="9999999999.99" step="0.01" required /></label>
        <label className="col-md-6 form-label">Thời hạn (ngày)<input className="form-control" type="number" name="durationDays" value={form.durationDays} onChange={change} min="1" max="3650" required /></label>
      </div>
      <button className="btn btn-primary align-self-start mt-2" disabled={saving}>{saving ? "Đang tạo..." : "Tạo và mở đăng ký"}</button>
    </form>
    {loading ? <p>Đang tải...</p> : items.length === 0 ? <p className="text-secondary">Bạn chưa tạo gói học phí nào.</p> : <div className="row g-3">
      {items.map(p => <div className="col-md-6" key={p.id}><div className="card h-100 p-3">
        <h3 className="h5">{p.name}</h3><p style={{ whiteSpace: "pre-wrap" }}>{p.description}</p>
        <p className="fw-bold">{Number(p.price).toLocaleString("vi-VN")} đ · {p.durationDays} ngày</p>
        <span className="text-success">{p.status === "ACTIVE" ? "Đang mở đăng ký" : p.status}</span>
      </div></div>)}
    </div>}
  </>;
}
