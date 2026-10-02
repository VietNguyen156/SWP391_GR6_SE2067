import { createContext, useContext, useEffect, useState } from 'react'
import httpClient, {
  refreshAccessTokenRequest,
  setAccessToken,
  setAccessTokenChangedHandler,
  setSessionExpiredHandler,
} from '../../services/httpClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setContextAccessToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setAccessTokenChangedHandler(setContextAccessToken)
    setSessionExpiredHandler(() => {
      setAccessToken(null)
      setUser(null)
      setIsLoading(false)
      if (!['/login', '/register'].includes(window.location.pathname)) {
        window.location.assign('/login')
      }
    })

    let active = true
    async function restoreSession() {
      try {
        const refreshResponse = await refreshAccessTokenRequest()
        setAccessToken(refreshResponse.data.data.accessToken)
        const userResponse = await httpClient.get('/auth/me')
        if (active) setUser(userResponse.data.data)
      } catch {
        setAccessToken(null)
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      active = false
      setAccessTokenChangedHandler(() => {})
      setSessionExpiredHandler(() => {})
    }
  }, [])

  async function login(credentials) {
    const response = await httpClient.post('/auth/login', credentials)
    const session = response.data.data
    setAccessToken(session.accessToken)
    setUser(session.user)
    return session.user
  }

  async function register(details) {
    const response = await httpClient.post('/auth/register', details)
    return response.data.data
  }

  async function refreshAccessToken() {
    const response = await refreshAccessTokenRequest()
    const token = response.data.data.accessToken
    setAccessToken(token)
    return token
  }

  async function logout() {
    try {
      await httpClient.post('/auth/logout')
    } catch {
      // Clear local authentication even when the server cannot be reached.
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}