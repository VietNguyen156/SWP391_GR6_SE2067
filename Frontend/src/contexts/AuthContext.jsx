import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as authApi from "../services/authService";
import { clearSession, saveSession } from "../services/axiosClient";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("auth_user"));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const verification = useRef(0);

  const verifySession = useCallback(async () => {
    const requestId = ++verification.current;
    setInitializing(true);
    setSessionError("");
    if (!localStorage.getItem("access_token")) {
      clearSession();
      setInitializing(false);
      return;
    }
    try {
      const currentUser = await authApi.getMe();
      if (requestId !== verification.current) return;
      localStorage.setItem("auth_user", JSON.stringify(currentUser));
      setUser(currentUser);
    } catch (error) {
      if (requestId !== verification.current) return;
      if ([401, 403].includes(error.response?.status)) clearSession();
      else
        setSessionError("Chưa thể xác minh phiên đăng nhập. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      if (requestId === verification.current) setInitializing(false);
    }
  }, []);

  useEffect(() => {
    const handleUpdated = (event) => setUser(event.detail || readStoredUser());
    const handleLogout = () => {
      verification.current += 1;
      setInitializing(false);
      setUser(null);
      setSessionError("");
    };
    const handleUnavailable = () =>
      setSessionError("Máy chủ tạm thời không phản hồi. Vui lòng thử lại.");
    window.addEventListener("auth:updated", handleUpdated);
    window.addEventListener("auth:logout", handleLogout);
    window.addEventListener("auth:unavailable", handleUnavailable);
    verifySession();

    return () => {
      window.removeEventListener("auth:updated", handleUpdated);
      window.removeEventListener("auth:logout", handleLogout);
      window.removeEventListener("auth:unavailable", handleUnavailable);
      verification.current += 1;
    };
  }, [verifySession]);

  async function signIn(payload) {
    setLoading(true);
    try {
      const data = await authApi.login(payload);
      verification.current += 1;
      setSessionError("");
      setInitializing(false);
      saveSession(data);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(payload) {
    setLoading(true);
    try {
      const data = await authApi.register(payload);
      verification.current += 1;
      setSessionError("");
      setInitializing(false);
      saveSession(data);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    verification.current += 1;
    setInitializing(false);
    const refreshToken = localStorage.getItem("refresh_token");
    clearSession();
    setUser(null);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Local logout must still succeed when the server is temporarily unavailable.
      }
    }
  }

  async function saveProfile(payload) {
    const updatedUser = await authApi.updateProfile(payload);
    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }

  async function updatePassword(payload) {
    const response = await authApi.changePassword(payload);
    clearSession();
    setUser(null);
    return response;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initializing,
        sessionError,
        verifySession,
        signIn,
        signUp,
        signOut,
        saveProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
