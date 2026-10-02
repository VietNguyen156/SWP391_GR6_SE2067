import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export function ProtectedRoute({ roles }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="container py-5 text-center" role="status">Checking your session...</div>
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={`/${user.role.toLowerCase()}`} replace />
  return <Outlet />
}

export function GuestRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return <div className="container py-5 text-center" role="status">Checking your session...</div>
  }
  if (isAuthenticated) return <Navigate to={`/${user.role.toLowerCase()}`} replace />
  return <Outlet />
}