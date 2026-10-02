import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export default function AppNavbar() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container py-1">
        <Link className="navbar-brand fw-bold text-primary" to="/">
          TOEIC Path
        </Link>
        <div className="d-flex align-items-center gap-3">
          <NavLink className="nav-link" to="/">
            Courses
          </NavLink>
          {!isLoading && user && <NavLink className="nav-link" to={`/${user.role.toLowerCase()}`}>
            {user.role === 'ADMIN' ? 'Admin' : user.role === 'MENTOR' ? 'Mentor' : 'My learning'}
          </NavLink>}
          {!isLoading && user
            ? <button className="btn btn-outline-secondary" type="button" onClick={handleLogout}>Sign out</button>
            : !isLoading && <>
              <Link className="btn btn-outline-primary" to="/register">Register</Link>
              <Link className="btn btn-primary" to="/login">Sign in</Link>
            </>}
        </div>
      </div>
    </nav>
  )
}

