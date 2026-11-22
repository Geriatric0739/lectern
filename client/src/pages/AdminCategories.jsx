import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Icon from '../components/Icon.jsx'
import { formatDate, plural } from '../lib/format.js'

export default function AdminCategories() {
  const [categories, setCategories] = useState(null)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const data = await api('/categories')
      setCategories(data.categories)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(category) {
    setEditing(category)
    setName(category.name)
    setError('')
    setNotice('')
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (editing) {
        await api(`/categories/${editing.id}`, { method: 'PUT', body: { name } })
        setNotice('Category renamed.')
      } else {
        await api('/categories', { method: 'POST', body: { name } })
        setNotice('Category added.')
      }
      setName('')
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(category) {
    if (!window.confirm(`Delete the category "${category.name}"?`)) return
    setError('')
    setNotice('')
    try {
      await api(`/categories/${category.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          <span className="hl">Categories</span>
        </h1>
        <p className="page-sub">
          Categories group courses in the catalogue. A category that still has courses cannot be
          deleted.
        </p>
      </div>

      <div className="grid-main">
        <div>
          {error && <p className="error-text">{error}</p>}
          {notice && <p className="success-text">{notice}</p>}

          <div className="table-wrap" style={{ marginTop: error || notice ? '12px' : 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Courses</th>
                  <th>Created</th>
                  <th className="icon-cell" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {categories?.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{plural(category.course_count, 'course')}</td>
                    <td>{formatDate(category.created_at)}</td>
                    <td className="icon-cell">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => startEdit(category)}
                        aria-label={`Rename ${category.name}`}
                      >
                        <Icon name="pencil" size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => remove(category)}
                        disabled={category.course_count > 0}
                        title={
                          category.course_count > 0
                            ? 'Move its courses to another category first.'
                            : 'Delete category'
                        }
                        aria-label={`Delete ${category.name}`}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!categories && (
                  <tr>
                    <td colSpan={4} className="empty">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form className="card admin-form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Rename category' : 'Add category'}</h2>
          <div className="field">
            <label className="label" htmlFor="category-name">
              Name
            </label>
            <input
              id="category-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Philosophy"
              required
              minLength={2}
              maxLength={50}
            />
            <span className="hint">Names must be unique.</span>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {editing ? 'Save name' : 'Add category'}
          </button>
          {editing && (
            <button type="button" className="btn btn-outline btn-block" onClick={cancelEdit} style={{ marginTop: '10px' }}>
              Cancel
            </button>
          )}
        </form>
      </div>
    </>
  )
}
