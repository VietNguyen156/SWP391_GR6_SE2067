import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      })
      navigate('/login', { replace: true, state: { notice: 'Your student account is ready. Sign in to continue.' } })
    } catch (requestError) {
      const response = requestError.response?.data
      setError(response?.errors?.join('. ') || response?.message || 'Could not create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container py-5">
      <div className="auth-card mx-auto card border-0 shadow-sm">
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 mb-2">Create your account</h1>
          <p className="text-secondary mb-4">Start learning with TOEIC Path.</p>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="fullName">Full name</label>
              <input className="form-control" id="fullName" autoComplete="name" required maxLength={150}
                value={form.fullName} onChange={(event) => update('fullName', event.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerEmail">Email</label>
              <input className="form-control" id="registerEmail" type="email" autoComplete="email" required maxLength={255}
                value={form.email} onChange={(event) => update('email', event.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerPassword">Password</label>
              <input className="form-control" id="registerPassword" type="password" autoComplete="new-password"
                required minLength={8} maxLength={72} value={form.password}
                onChange={(event) => update('password', event.target.value)} />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
              <input className="form-control" id="confirmPassword" type="password" autoComplete="new-password"
                required minLength={8} maxLength={72} value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)} />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-secondary mt-4 mb-0">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}