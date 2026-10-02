import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="container py-5 text-center">
      <h1 className="display-5 fw-bold">404</h1>
      <p className="text-secondary">The requested page was not found.</p>
      <Link className="btn btn-primary" to="/">Back to home</Link>
    </section>
  )
}

