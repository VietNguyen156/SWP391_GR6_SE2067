import axiosClient from "./axiosClient";

export async function register(payload) {
  return (await axiosClient.post("/auth/register", payload)).data;
}

export async function login(payload) {
  return (await axiosClient.post("/auth/login", payload)).data;
}

export async function logout(refreshToken) {
  return (await axiosClient.post("/auth/logout", { refreshToken })).data;
}

export async function forgotPassword(email) {
  return (await axiosClient.post("/auth/forgot-password", { email })).data;
}

/** payload: { email, code (6 số), newPassword } */
export async function verifyResetCode(payload) {
  return (await axiosClient.post("/auth/verify-reset-code", payload)).data;
}

export async function resetPassword(payload) {
  return (await axiosClient.post("/auth/reset-password", payload)).data;
}

export async function getMe() {
  return (await axiosClient.get("/auth/me")).data;
}

export async function updateProfile(payload) {
  return (await axiosClient.put("/auth/profile", payload)).data;
}

export async function changePassword(payload) {
  return (await axiosClient.put("/auth/change-password", payload)).data;
}
