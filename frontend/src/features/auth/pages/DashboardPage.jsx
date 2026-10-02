export default function DashboardPage({ role }) {
  const dashboardTitles = {
    ADMIN: 'Administration',
    MENTOR: 'Mentor workspace',
    STUDENT: 'My learning',
  }

  return (
    <section className="container py-5">
      <p className="eyebrow mb-2">{role}</p>
      <h1 className="h2 mb-3">{dashboardTitles[role]}</h1>
      <p className="text-secondary">Welcome back. Your TOEIC Path workspace is ready.</p>
    </section>
  )
}