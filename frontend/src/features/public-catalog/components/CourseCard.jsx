const levelLabels = {
  STARTER: 'Starter',
  ELEMENTARY_A1: 'Elementary (A1)',
  PRE_INTERMEDIATE_A2: 'Pre-Intermediate (A2)',
  INTERMEDIATE_B1: 'Intermediate (B1)',
  UPPER_INTERMEDIATE_B2: 'Upper-Intermediate (B2)',
}

function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

export default function CourseCard({ course }) {
  return (
    <article className="card h-100 border-0 shadow-sm course-card">
      <div className="card-body p-4">
        <span className="badge text-bg-primary-subtle text-primary mb-3">
          {levelLabels[course.level] || course.level}
        </span>
        <h3 className="h5">{course.title}</h3>
        <p className="text-secondary course-description">{course.description}</p>
        <div className="d-flex justify-content-between align-items-center mt-4">
          <strong className="text-primary">{formatVnd(course.priceVnd)}</strong>
          <span className="small text-secondary">{course.code}</span>
        </div>
      </div>
    </article>
  )
}

