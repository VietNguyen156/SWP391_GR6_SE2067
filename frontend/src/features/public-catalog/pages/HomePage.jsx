import { useEffect, useState } from 'react'
import CourseCard from '../components/CourseCard.jsx'
import { getPublishedCourses } from '../services/publicCourseService.js'

export default function HomePage() {
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true

    getPublishedCourses()
      .then((data) => {
        if (active) {
          setCourses(data)
          setStatus('success')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <section className="hero-section py-5">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="eyebrow">A shared foundation for the whole team</span>
              <h1 className="display-4 fw-bold mt-3">
                Build a clear path to your TOEIC goal.
              </h1>
              <p className="lead text-secondary mt-3 mb-0">
                Courses, classes, practice activities, assessments, and progress in one platform.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="hero-panel p-4 p-lg-5">
                <div className="small text-uppercase text-secondary mb-2">Target levels</div>
                <div className="d-flex flex-wrap gap-2">
                  {['Starter', 'A1', 'A2', 'B1', 'B2'].map((level) => (
                    <span className="level-pill" key={level}>{level}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <span className="eyebrow">Public catalog</span>
            <h2 className="mt-2 mb-0">Published courses</h2>
          </div>
        </div>

        {status === 'loading' && (
          <div className="alert alert-light border">Loading courses...</div>
        )}

        {status === 'error' && (
          <div className="alert alert-warning">
            The frontend is ready. Start the Spring Boot backend to load courses from MySQL.
          </div>
        )}

        {status === 'success' && courses.length === 0 && (
          <div className="alert alert-light border">No published courses are available.</div>
        )}

        <div className="row g-4">
          {courses.map((course) => (
            <div className="col-md-6 col-xl-4" key={course.id}>
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

