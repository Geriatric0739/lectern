import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Badge from '../components/Badge.jsx'
import Icon from '../components/Icon.jsx'
import { plural } from '../lib/format.js'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function Courses() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/categories')
      .then((result) => setCategories(result.categories))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let active = true
    const timer = setTimeout(
      () => {
        const params = new URLSearchParams({ page: String(page) })
        if (search.trim()) params.set('search', search.trim())
        if (category) params.set('category', category)
        if (level) params.set('level', level)

        api(`/courses?${params}`)
          .then((result) => {
            if (active) {
              setData(result)
              setError('')
            }
          })
          .catch((err) => {
            if (active) setError(err.message)
          })
      },
      search ? 250 : 0,
    )

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search, category, level, page])

  function changeFilter(setter) {
    return (event) => {
      setter(event.target.value)
      setPage(1)
    }
  }

  const courses = data?.courses ?? []
  const total = data?.total ?? 0
  const perPage = data?.per_page ?? 8
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          <span className="hl">Courses</span>
        </h1>
        <p className="page-sub">
          {plural(total, 'published course')}. Open a course to see its lessons, then enroll to
          track your progress.
        </p>
      </div>

      <div className="toolbar">
        <div className="search-field">
          <Icon name="search" />
          <input
            className="input"
            placeholder="Search courses by title or instructor"
            value={search}
            onChange={changeFilter(setSearch)}
            aria-label="Search courses"
          />
        </div>
        <select
          className="select"
          value={category}
          onChange={changeFilter(setCategory)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={level}
          onChange={changeFilter(setLevel)}
          aria-label="Filter by level"
        >
          <option value="">All levels</option>
          {LEVELS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Instructor</th>
              <th>Category</th>
              <th>Level</th>
              <th>Lessons</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="title-cell">
                  <Link to={`/courses/${course.id}`}>
                    <strong>{course.title}</strong>
                  </Link>
                  <span>{course.description}</span>
                </td>
                <td>{course.instructor_name}</td>
                <td>{course.category_name}</td>
                <td>
                  <Badge tone="neutral">{course.level}</Badge>
                </td>
                <td className="nowrap">{plural(course.lesson_count, 'lesson')}</td>
                <td>
                  {course.enrolled ? (
                    <Badge tone="success">Enrolled</Badge>
                  ) : (
                    <Link to={`/courses/${course.id}`}>View course</Link>
                  )}
                </td>
              </tr>
            ))}
            {data && courses.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  No courses match these filters.
                </td>
              </tr>
            )}
            {!data && (
              <tr>
                <td colSpan={6} className="empty">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="muted small">
          {total === 0 ? 'No courses' : `Showing ${from} to ${to} of ${total} courses`}
        </span>
        <div className="pagination-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={to >= total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}
