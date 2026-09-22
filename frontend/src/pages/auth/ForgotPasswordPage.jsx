import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword,resetPassword } from "../../services/authService";
export default function ForgotPasswordPage(){
 const [email,setEmail]=useState("");const [token,setToken]=useState("");const [newPassword,setNewPassword]=useState("");const [message,setMessage]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 async function request(e){e.preventDefault();setLoading(true);setError("");try{const data=await forgotPassword(email);setMessage(data.message);if(data.resetToken)setToken(data.resetToken);}catch(err){setError(err.response?.data?.message||"Không thể tạo yêu cầu");}finally{setLoading(false);}}
 async function reset(e){e.preventDefault();setLoading(true);setError("");try{const data=await resetPassword(token,newPassword);setMessage(data.message+". Bạn có thể đăng nhập bằng mật khẩu mới.");setNewPassword("");}catch(err){setError(err.response?.data?.message||"Không thể đổi mật khẩu");}finally{setLoading(false);}}
 return <div className="row justify-content-center"><div className="col-md-7 col-lg-5"><div className="card border-0 shadow-lg rounded-4 p-4 p-md-5">
  <h1 className="h3 fw-bold">Quên mật khẩu</h1><p className="text-secondary">Nhập email để nhận mã đặt lại mật khẩu.</p>
  {message&&<div className="alert alert-success small">{message}</div>}{error&&<div className="alert alert-danger">{error}</div>}
  <form onSubmit={request}><label className="form-label fw-semibold">Email</label><input className="form-control form-control-lg mb-3" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><button className="btn btn-primary w-100" disabled={loading}>Tạo mã đặt lại</button></form>
  {token&&<><hr className="my-4"/><div className="alert alert-warning small"><b>Demo token:</b><br/><span className="text-break">{token}</span><br/>Khi triển khai thật, token này sẽ được gửi qua email.</div>
   <form onSubmit={reset}><label className="form-label fw-semibold">Mật khẩu mới</label><input className="form-control mb-3" type="password" minLength="6" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/><button className="btn btn-dark w-100" disabled={loading}>Đặt lại mật khẩu</button></form></>}
  <div className="text-center mt-4"><Link to="/login">← Quay lại đăng nhập</Link></div>
 </div></div></div>;
}
