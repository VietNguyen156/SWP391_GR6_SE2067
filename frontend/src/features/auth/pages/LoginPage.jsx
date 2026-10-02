import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const user = await login(credentials)
      navigate(`/${user.role.toLowerCase()}`, { replace: true })
    } catch (requestError) {
      const code = requestError.response?.data?.errorCode
      setError(code === 'ACCOUNT_BLOCKED'
        ? 'This account has been blocked. Contact support for help.'
        : 'Email or password is incorrect. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container py-5">
      <div className="auth-card mx-auto card border-0 shadow-sm">
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 mb-2">Sign in</h1>
          <p className="text-secondary mb-4">Continue your TOEIC learning journey.</p>
          {location.state?.notice && <div className="alert alert-success" role="status">{location.state.notice}</div>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email</label>
              <input className="form-control" id="email" type="email" autoComplete="email" required
                value={credentials.email}
                onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="password">Password</label>
              <input className="form-control" id="password" type="password" autoComplete="current-password" required
                value={credentials.password}
                onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-secondary mt-4 mb-0">
            New to TOEIC Path? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

