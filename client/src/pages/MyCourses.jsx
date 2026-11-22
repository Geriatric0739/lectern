import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Badge from '../components/Badge.jsx'
import Icon from '../components/Icon.jsx'
import { formatDate } from '../lib/format.js'

const TABS = [
  ['all', 'All courses'],
  ['published', 'Published'],
  ['draft', 'Drafts'],
]

export default function MyCourses() {
  const [courses, setCourses] = useState(null)
  const [tab, setTab] = useState('all')
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await api('/my/courses')
      setCourses(data.courses)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(course) {
    if (!window.confirm(`Delete "${course.title}"? Its lessons and enrollments are removed too.`)) {
      return
    }
    try {
      await api(`/courses/${course.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!courses) return <p className="muted">Loading…</p>

  const visible = tab === 'all' ? courses : courses.filter((course) => course.status === tab)
  const count = (status) =>
    status === 'all' ? courses.length : courses.filter((course) => course.status === status).length

  return (
    <>
      <div className="page-head row-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <span className="hl">My courses</span>
          </h1>
          <p className="page-sub">Drafts are visible only to you. Publish a course when its lessons are ready.</p>
        </div>
        <Link className="btn btn-primary" to="/my-courses/new">
          <Icon name="plus" size={14} /> New course
        </Link>
      </div>

      <div className="tabs">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={tab === value ? 'tab active' : 'tab'}
            onClick={() => setTab(value)}
          >
            {label} <span className="muted">{count(value)}</span>
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Status</th>
              <th>Lessons</th>
              <th>Enrolled</th>
              <th>Updated</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visible.map((course) => (
              <tr key={course.id}>
                <td className="title-cell">
                  <strong>{course.title}</strong>
                  <span>{course.category_name}</span>
                </td>
                <td>
                  {course.status === 'published' ? (
                    <Badge tone="success">Published</Badge>
                  ) : (
                    <Badge tone="warning">Draft</Badge>
                  )}
                </td>
                <td>{course.lesson_count}</td>
                <td>{course.enrollments_count}</td>
                <td className="nowrap">{formatDate(course.updated_at)}</td>
                <td>
                  <div className="table-actions">
                    <Link className="btn btn-outline btn-sm" to={`/my-courses/${course.id}/students`}>
                      Students
                    </Link>
                    <Link className="btn btn-outline btn-sm" to={`/my-courses/${course.id}/edit`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => remove(course)}
                      aria-label={`Delete ${course.title}`}
                      title="Delete course"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  No courses in this tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
