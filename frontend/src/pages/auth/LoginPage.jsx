import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
export default function LoginPage(){
 const [form,setForm]=useState({email:"",password:""}); const [error,setError]=useState(""); const {signIn,loading}=useAuth(); const navigate=useNavigate();
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 async function submit(e){e.preventDefault();setError("");try{await signIn(form);navigate("/");}catch(err){setError(err.response?.data?.message||"Không thể đăng nhập");}}
 return <div className="row justify-content-center"><div className="col-md-7 col-lg-5">
  <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5">
   <div className="mb-4"><span className="badge text-bg-primary-subtle text-primary mb-2">HỌC TOEIC HIỆU QUẢ</span><h1 className="h3 fw-bold">Đăng nhập</h1><p className="text-secondary mb-0">Tiếp tục lộ trình TOEIC của bạn.</p></div>
   {error&&<div className="alert alert-danger">{error}</div>}
   <form onSubmit={submit}>
    <label className="form-label fw-semibold">Email</label><input className="form-control form-control-lg mb-3" name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com"/>
    <div className="d-flex justify-content-between"><label className="form-label fw-semibold">Mật khẩu</label><Link className="small" to="/forgot-password">Quên mật khẩu?</Link></div>
    <input className="form-control form-control-lg mb-4" name="password" type="password" value={form.password} onChange={change} required placeholder="••••••••"/>
    <button className="btn btn-primary btn-lg w-100" disabled={loading}>{loading?"Đang đăng nhập...":"Đăng nhập"}</button>
   </form>
   <p className="text-center mt-4 mb-0 text-secondary">Chưa có tài khoản? <Link to="/register" className="fw-semibold">Đăng ký ngay</Link></p>
  </div>
 </div></div>;
}
