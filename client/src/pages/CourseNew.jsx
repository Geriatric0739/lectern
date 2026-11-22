import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function CourseNew() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    level: 'Beginner',
    description: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/categories')
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(err.message))
  }, [])

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api('/courses', {
        method: 'POST',
        body: { ...form, category_id: Number(form.category_id) },
      })
      navigate(`/my-courses/${data.course.id}/edit`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <p className="crumb">
        <Link to="/my-courses">My courses</Link> / New course
      </p>

      <div className="page-head">
        <h1 className="page-title">
          <span className="hl">New course</span>
        </h1>
        <p className="page-sub">A new course starts as a draft. You can add lessons before publishing.</p>
      </div>

      <form className="card card-pad" onSubmit={handleSubmit} style={{ maxWidth: '720px' }}>
        <div className="field">
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="input"
            value={form.title}
            onChange={update('title')}
            placeholder="e.g. Introduction to Networks"
            required
            minLength={3}
            maxLength={80}
          />
          <span className="hint">Shown in the catalogue. 3 to 80 characters.</span>
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="category">
              Category
            </label>
            <select id="category" className="select" value={form.category_id} onChange={update('category_id')} required>
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="level">
              Level
            </label>
            <select id="level" className="select" value={form.level} onChange={update('level')}>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="textarea"
            value={form.description}
            onChange={update('description')}
            maxLength={600}
            placeholder="A short paragraph shown on the course page."
          />
          <span className="hint">{form.description.length} of 600 characters</span>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create draft'}
          </button>
          <Link className="btn btn-outline" to="/my-courses">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}
