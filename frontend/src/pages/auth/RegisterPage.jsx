import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
export default function RegisterPage(){
 const [form,setForm]=useState({fullName:"",email:"",phone:"",password:"",confirmPassword:""});const [error,setError]=useState("");const {signUp,loading}=useAuth();const navigate=useNavigate();
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 async function submit(e){e.preventDefault();setError("");if(form.password!==form.confirmPassword){setError("Mật khẩu xác nhận không khớp");return;}try{const {confirmPassword,...payload}=form;await signUp(payload);navigate("/");}catch(err){setError(err.response?.data?.message||"Không thể đăng ký");}}
 return <div className="row justify-content-center"><div className="col-md-8 col-lg-6"><div className="card border-0 shadow-lg rounded-4 p-4 p-md-5">
  <h1 className="h3 fw-bold">Tạo tài khoản học viên</h1><p className="text-secondary mb-4">Đăng ký để bắt đầu lộ trình TOEIC của bạn.</p>
  {error&&<div className="alert alert-danger">{error}</div>}
  <form onSubmit={submit} className="row g-3">
   <div className="col-12"><label className="form-label fw-semibold">Họ và tên</label><input className="form-control form-control-lg" name="fullName" value={form.fullName} onChange={change} required/></div>
   <div className="col-md-7"><label className="form-label fw-semibold">Email</label><input className="form-control form-control-lg" type="email" name="email" value={form.email} onChange={change} required/></div>
   <div className="col-md-5"><label className="form-label fw-semibold">Số điện thoại</label><input className="form-control form-control-lg" name="phone" value={form.phone} onChange={change}/></div>
   <div className="col-md-6"><label className="form-label fw-semibold">Mật khẩu</label><input className="form-control form-control-lg" type="password" minLength="6" name="password" value={form.password} onChange={change} required/></div>
   <div className="col-md-6"><label className="form-label fw-semibold">Xác nhận mật khẩu</label><input className="form-control form-control-lg" type="password" minLength="6" name="confirmPassword" value={form.confirmPassword} onChange={change} required/></div>
   <div className="col-12"><button className="btn btn-primary btn-lg w-100" disabled={loading}>{loading?"Đang tạo tài khoản...":"Đăng ký"}</button></div>
  </form>
  <p className="text-center mt-4 mb-0 text-secondary">Đã có tài khoản? <Link to="/login" className="fw-semibold">Đăng nhập</Link></p>
 </div></div></div>;
}
