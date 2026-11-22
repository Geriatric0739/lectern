import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { formatDate, plural } from '../lib/format.js'

export default function CourseStudents() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/courses/${id}/students`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <div className="card card-pad">{error}</div>
  if (!data) return <p className="muted">Loading…</p>

  const { course, students } = data

  return (
    <>
      <p className="crumb">
        <Link to="/my-courses">My courses</Link> / {course.title}
      </p>

      <div className="page-head row-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <span className="hl">Students</span>
          </h1>
          <p className="page-sub">
            {plural(students.length, 'student')} {students.length === 1 ? 'is' : 'are'} enrolled in this
            course. Progress is the number of lessons each student has marked complete.
          </p>
        </div>
        <Link className="btn btn-outline" to={`/my-courses/${course.id}/edit`}>
          Edit course
        </Link>
      </div>

      <div className="tabs">
        <Link className="tab" to={`/my-courses/${course.id}/edit`}>
          Lessons {course.lesson_count}
        </Link>
        <span className="tab active">Students {students.length}</span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Enrolled</th>
              <th style={{ width: '28%' }}>Progress</th>
              <th>Last activity</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  <div className="row">
                    <Avatar name={student.full_name} />
                    <div>
                      <strong>{student.full_name}</strong>
                      <div className="muted small">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="nowrap">{formatDate(student.enrolled_at)}</td>
                <td>
                  <div className="progress-row">
                    <ProgressBar completed={student.completed} total={student.total} />
                    <span className="progress-label">
                      {student.completed} of {student.total}
                    </span>
                  </div>
                </td>
                <td>{student.last_activity ? formatDate(student.last_activity) : 'Not started'}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  Nobody has enrolled yet. Publish the course to list it in the catalogue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
