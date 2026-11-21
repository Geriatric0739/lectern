import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Badge from '../components/Badge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { formatMinutes, plural } from '../lib/format.js'

const STATUS = {
  not_started: ['neutral', 'Not started'],
  in_progress: ['neutral', 'In progress'],
  completed: ['success', 'Completed'],
}

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/my/enrollments')
      .then((data) => setEnrollments(data.enrollments))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="card card-pad">{error}</div>
  if (!enrollments) return <p className="muted">Loading…</p>

  const completedCount = enrollments.filter((item) => item.status === 'completed').length
  const current =
    enrollments
      .filter((item) => item.status !== 'completed')
      .sort((a, b) => String(b.last_activity ?? '').localeCompare(String(a.last_activity ?? '')))[0] ??
    enrollments[0]

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          <span className="hl">My learning</span>
        </h1>
        <p className="page-sub">
          {plural(enrollments.length, 'enrolled course')}, {completedCount} completed.
        </p>
      </div>

      {current && (
        <section className="card continue-card">
          <div>
            <p className="kicker">Continue where you left off</p>
            <h2>{current.title}</h2>
            <p className="muted small">
              {current.next_lesson
                ? `Lesson ${current.next_lesson.position} of ${current.total} · ${current.next_lesson.title} · ${formatMinutes(current.next_lesson.duration_min)}`
                : `${current.total} of ${current.total} lessons completed`}
            </p>
          </div>
          <Link
            className="btn btn-primary"
            to={
              current.next_lesson
                ? `/courses/${current.course_id}/lessons/${current.next_lesson.id}`
                : `/courses/${current.course_id}`
            }
          >
            {current.next_lesson ? 'Resume lesson' : 'Review course'}
          </Link>
        </section>
      )}

      <h2 className="section-title" style={{ marginBottom: '16px' }}>
        Enrolled courses
      </h2>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th style={{ width: '30%' }}>Progress</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {enrollments.map((item) => {
              const [tone, label] = STATUS[item.status]
              return (
                <tr key={item.course_id}>
                  <td className="title-cell">
                    <Link to={`/courses/${item.course_id}`}>
                      <strong>{item.title}</strong>
                    </Link>
                    <span>{item.instructor_name}</span>
                  </td>
                  <td>
                    <div className="progress-row">
                      <ProgressBar completed={item.completed} total={item.total} />
                      <span className="progress-label">
                        {item.completed} of {item.total} lessons
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge tone={tone}>{label}</Badge>
                  </td>
                  <td>
                    <Link
                      to={
                        item.next_lesson
                          ? `/courses/${item.course_id}/lessons/${item.next_lesson.id}`
                          : `/courses/${item.course_id}`
                      }
                    >
                      {item.status === 'completed' ? 'Review' : item.status === 'not_started' ? 'Start' : 'Continue'}
                    </Link>
                  </td>
                </tr>
              )
            })}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  You are not enrolled in any course yet.{' '}
                  <Link to="/courses">Browse the catalogue</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
