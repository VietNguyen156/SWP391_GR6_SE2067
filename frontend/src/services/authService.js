import axiosClient from "./axiosClient";
export async function register(payload){ const {data}=await axiosClient.post("/auth/register",payload); return data; }
export async function login(payload){ const {data}=await axiosClient.post("/auth/login",payload); return data; }
export async function forgotPassword(email){ const {data}=await axiosClient.post("/auth/forgot-password",{email}); return data; }
export async function resetPassword(token,newPassword){ const {data}=await axiosClient.post("/auth/reset-password",{token,newPassword}); return data; }
export async function getMe(){ const {data}=await axiosClient.get("/auth/me"); return data; }
