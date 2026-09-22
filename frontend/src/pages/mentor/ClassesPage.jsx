import { useEffect, useState } from "react";
import { addStudent, createClass, getMentorClasses, getStudents } from "../../services/classService";
const initial = { name: "", description: "", startDate: "", endDate: "", maxStudents: 30 };
function ClassStudents({ item, onAdded }) {
  const [students, setStudents] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    let active = true;
    getStudents(item.id).then(data => { if (active) setStudents(data); })
      .catch(() => { if (active) setError("Không tải được danh sách học viên."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [item.id]);
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const student = await addStudent(item.id, email.trim());
      setStudents(current => [student, ...current]); setEmail(""); onAdded(item.id); setSuccess("Đã thêm học viên vào lớp.");
    } catch (err) { setError(err.response?.data?.message || "Không thể thêm học viên."); }
    finally { setSaving(false); }
  }
  return <section className="card p-4 mt-4">
    <h3 className="h5">Học viên · {item.name}</h3>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {success && <div role="status" className="alert alert-success">{success}</div>}
    <form className="d-flex flex-wrap gap-2 my-3 align-items-end" onSubmit={submit}>
      <label className="form-label flex-grow-1 mb-0">Email tài khoản học viên
        <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={255} placeholder="hocvien@example.com" />
      </label>
      <button className="btn btn-primary" disabled={saving || loading}>{saving ? "Đang thêm..." : "Thêm vào lớp"}</button>
    </form>
    {loading ? <p>Đang tải...</p> : students.length === 0 ? <p>Lớp chưa có học viên.</p> :
      <div className="table-responsive"><table className="table"><thead><tr><th>Họ tên</th><th>Email</th><th>Trạng thái</th></tr></thead>
        <tbody>{students.map(s => <tr key={s.id}><td>{s.fullName}</td><td>{s.email}</td><td>{s.status === "ACTIVE" ? "Đang học" : s.status}</td></tr>)}</tbody>
      </table></div>}
  </section>;
}
export default function ClassesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => { getMentorClasses().then(setItems).catch(() => setError("Không tải được lớp học. Vui lòng tải lại trang.")).finally(() => setLoading(false)); }, []);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const item = await createClass({ ...form, startDate: form.startDate || null, endDate: form.endDate || null, maxStudents: Number(form.maxStudents) });
      setItems(current => [item, ...current]); setSelected(item); setForm(initial); setSuccess("Đã tạo lớp học. Bạn có thể thêm học viên bên dưới.");
    } catch (err) { setError(err.response?.data?.message || "Không thể tạo lớp học."); }
    finally { setSaving(false); }
  }
  return <>
    <h2 className="h4">Lớp học của bạn</h2>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {success && <div role="status" className="alert alert-success">{success}</div>}
    <form className="card p-4 my-3" onSubmit={submit}>
      <h3 className="h5">Tạo lớp học</h3>
      <label className="form-label">Tên lớp<input className="form-control" name="name" value={form.name} onChange={change} required maxLength={180} /></label>
      <label className="form-label">Mô tả<textarea className="form-control" name="description" value={form.description} onChange={change} maxLength={10000} /></label>
      <div className="row">
        <label className="col-md-4 form-label">Ngày bắt đầu<input className="form-control" type="date" name="startDate" value={form.startDate} onChange={change} /></label>
        <label className="col-md-4 form-label">Ngày kết thúc<input className="form-control" type="date" name="endDate" min={form.startDate || undefined} value={form.endDate} onChange={change} /></label>
        <label className="col-md-4 form-label">Sĩ số tối đa<input className="form-control" type="number" name="maxStudents" min="1" max="10000" value={form.maxStudents} onChange={change} required /></label>
      </div>
      <button className="btn btn-primary align-self-start mt-2" disabled={saving}>{saving ? "Đang tạo..." : "Tạo lớp"}</button>
    </form>
    {loading ? <p>Đang tải...</p> : items.length === 0 ? <p>Bạn chưa tạo lớp học nào.</p> : <div className="row g-3">
      {items.map(c => <div className="col-md-6" key={c.id}><div className="card p-3 h-100">
        <h3 className="h5">{c.name}</h3><p className="small text-secondary text-break">Mã lớp: {c.classCode}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{c.description}</p>
        <p>{c.studentCount}/{c.maxStudents ?? "Không giới hạn"} học viên</p>
        <p>{c.startDate || "Chưa có ngày bắt đầu"} → {c.endDate || "Chưa có ngày kết thúc"}</p>
        <button className="btn btn-outline-primary mt-auto" onClick={() => setSelected(c)}>Quản lý học viên</button>
      </div></div>)}
    </div>}
    {selected && <ClassStudents key={selected.id} item={selected} onAdded={id => setItems(current => current.map(c => c.id === id ? { ...c, studentCount: c.studentCount + 1 } : c))} />}
  </>;
}
