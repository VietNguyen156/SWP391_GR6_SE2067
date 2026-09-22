import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../services/authService";
const AuthContext=createContext(null);
export function AuthProvider({children}){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("auth_user"));}catch{return null;}});
  const [loading,setLoading]=useState(false);
  useEffect(()=>{const token=localStorage.getItem("access_token"); if(token && !user){authApi.getMe().then(u=>{setUser(u);localStorage.setItem("auth_user",JSON.stringify(u));}).catch(()=>logout());}},[]);
  function saveAuth(data){localStorage.setItem("access_token",data.token);localStorage.setItem("auth_user",JSON.stringify(data.user));setUser(data.user);}
  async function signIn(payload){setLoading(true);try{const data=await authApi.login(payload);saveAuth(data);return data;}finally{setLoading(false);}}
  async function signUp(payload){setLoading(true);try{const data=await authApi.register(payload);saveAuth(data);return data;}finally{setLoading(false);}}
  function logout(){localStorage.removeItem("access_token");localStorage.removeItem("auth_user");setUser(null);}
  return <AuthContext.Provider value={{user,loading,signIn,signUp,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth(){return useContext(AuthContext);}
