import axios from "axios";

const baseURL = (import.meta.env?.VITE_API_URL || "http://localhost:8080/api").replace(/\/+$/, "");
const axiosClient = axios.create({ baseURL, timeout: 10000 });
let refreshRequest = null;
let sessionVersion = 0;

function saveSession(data) {
  sessionVersion += 1;
  localStorage.setItem("access_token", data.accessToken);
  localStorage.setItem("refresh_token", data.refreshToken);
  localStorage.setItem("auth_user", JSON.stringify(data.user));
  window.dispatchEvent(new CustomEvent("auth:updated", { detail: data.user }));
}

/** Trang đăng nhập kèm lý do và trang đang mở, để đăng nhập lại xong quay về đúng chỗ. */
function loginUrl(reason) {
  const from = `${window.location.pathname}${window.location.search}`;
  return `/login?reason=${reason}&from=${encodeURIComponent(from)}`;
}

function clearSession() {
  sessionVersion += 1;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");
  window.dispatchEvent(new Event("auth:logout"));
}

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem("refresh_token");
    const isTokenEndpoint = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].some(
      (path) => original?.url?.includes(path),
    );

    if (error.response?.status !== 401 || !original || original._retry || isTokenEndpoint) {
      return Promise.reject(error);
    }

    // A legacy/stale browser session can still have an access token but no usable
    // refresh token. Do not leave the user on a protected page showing a raw 401.
    if (!refreshToken) {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.assign(loginUrl("session-expired"));
      }
      return Promise.reject(error);
    }

    original._retry = true;
    const version = sessionVersion;
    try {
      if (!refreshRequest || refreshRequest.version !== version) {
        const request = { version, promise: null };
        refreshRequest = request;
        request.promise = axios
          .post(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: 10000 })
          .then(({ data }) => {
            if (
              sessionVersion !== version ||
              localStorage.getItem("refresh_token") !== refreshToken
            ) {
              throw new axios.CanceledError("Session changed while refreshing");
            }
            saveSession(data);
            return data.accessToken;
          })
          .finally(() => {
            if (refreshRequest === request) refreshRequest = null;
          });
      }
      const accessToken = await refreshRequest.promise;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${accessToken}`;
      return axiosClient(original);
    } catch (refreshError) {
      if (axios.isCancel(refreshError) || sessionVersion !== version) {
        return Promise.reject(refreshError);
      }
      if ([400, 401, 403].includes(refreshError.response?.status)) {
        clearSession();
        if (window.location.pathname !== "/login") {
          const locked = refreshError.response?.data?.code === "ACCOUNT_LOCKED";
          window.location.assign(loginUrl(locked ? "account-locked" : "session-expired"));
        }
      } else {
        window.dispatchEvent(new Event("auth:unavailable"));
      }
      return Promise.reject(refreshError);
    }
  },
);

export { clearSession, saveSession };
export default axiosClient;
