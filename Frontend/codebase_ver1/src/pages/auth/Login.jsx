import {Link,useNavigate} from 'react-router-dom';
import React from "react";
export default function Login(){const go=useNavigate();return <div className="auth"><form onSubmit={e=>{e.preventDefault();go('/user/dashboard')}}><h1>Welcome back</h1><p>Sign in to continue learning English.</p><label>Email</label><input type="email" placeholder="student@example.com"/><label>Password</label><input type="password" placeholder="••••••••"/><button className="primary">Sign In</button><p>Don't have an account? <Link to="/register">Register</Link></p></form></div>}
