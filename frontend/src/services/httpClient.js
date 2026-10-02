import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const httpClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
})

let accessToken = null
let onSessionExpired = () => {}
let onAccessTokenChanged = () => {}
let refreshRequest = null

export function setAccessToken(token) {
  accessToken = token
  onAccessTokenChanged(token)
}

export function setAccessTokenChangedHandler(handler) {
  onAccessTokenChanged = handler
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

export function refreshAccessTokenRequest() {
  if (!refreshRequest) {
    refreshRequest = axios.post(`${baseURL}/auth/refresh`, {}, {
      withCredentials: true,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    }).finally(() => {
      refreshRequest = null
    })
  }
  return refreshRequest
}

httpClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

httpClient.interceptors.response.use((response) => response, async (error) => {
  const request = error.config
  const isAuthRequest = request?.url?.includes('/auth/')

  if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
    return Promise.reject(error)
  }

  request._retry = true
  try {
    const response = await refreshAccessTokenRequest()
    setAccessToken(response.data.data.accessToken)
    request.headers.Authorization = `Bearer ${accessToken}`
    return httpClient(request)
  } catch (refreshError) {
    setAccessToken(null)
    onSessionExpired()
    return Promise.reject(refreshError)
  }
})

export default httpClient

