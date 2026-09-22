import { useEffect, useState } from "react";
import { getMyClasses } from "../../services/classService";
export default function MyClassesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getMyClasses().then(setItems).catch(() => setError("Không tải được lớp học. Vui lòng tải lại trang.")).finally(() => setLoading(false)); }, []);
  return <div className="container py-5"><h1 className="h3">Lớp học của tôi</h1>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {loading ? <p>Đang tải...</p> : items.length === 0 ? <p>Bạn chưa tham gia lớp nào. Liên hệ mentor để được thêm vào lớp.</p> : <div className="row g-3">
      {items.map(c => <div className="col-md-6" key={c.id}><article className="card p-4 h-100">
        <h2 className="h5">{c.name}</h2><p>Mentor: {c.mentorName}</p><p style={{ whiteSpace: "pre-wrap" }}>{c.description}</p>
        <p>{c.startDate || "Chưa có ngày bắt đầu"} → {c.endDate || "Chưa có ngày kết thúc"}</p>
        <p className="small text-secondary text-break">Mã lớp: {c.classCode}</p>
      </article></div>)}
    </div>}
  </div>;
}
