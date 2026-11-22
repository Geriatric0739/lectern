import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { formatDate } from '../lib/format.js'

const ROLES = ['student', 'instructor', 'admin']
const EMPTY = { full_name: '', email: '', password: '', role: 'student' }

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const data = await api('/users')
      setUsers(data.users)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function setField(key) {
    return (event) => setForm({ ...form, [key]: event.target.value })
  }

  async function addUser(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await api('/users', { method: 'POST', body: form })
      setNotice('User added.')
      setForm(EMPTY)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function changeRole(target, role) {
    setError('')
    setNotice('')
    try {
      await api(`/users/${target.id}/role`, { method: 'PUT', body: { role } })
      setNotice(`${target.full_name} is now ${role === 'admin' ? 'an' : 'a'} ${role}.`)
      await load()
    } catch (err) {
      setError(err.message)
      await load()
    }
  }

  async function remove(target) {
    if (!window.confirm(`Delete the user "${target.full_name}"? This cannot be undone.`)) return
    setError('')
    setNotice('')
    try {
      await api(`/users/${target.id}`, { method: 'DELETE' })
      setNotice('User deleted.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          <span className="hl">Users</span>
        </h1>
        <p className="page-sub">
          Manage accounts and roles. Students enrol, instructors create courses, admins manage the
          catalogue.
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
                  <th>User</th>
                  <th>Role</th>
                  <th>Courses</th>
                  <th>Enrollments</th>
                  <th>Joined</th>
                  <th className="icon-cell" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {users?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="row">
                        <Avatar name={item.full_name} />
                        <div>
                          <strong>{item.full_name}</strong>
                          <div className="muted small">{item.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: '150px' }}
                        value={item.role}
                        disabled={item.id === user.id}
                        onChange={(event) => changeRole(item, event.target.value)}
                        aria-label={`Role for ${item.full_name}`}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role[0].toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{item.course_count}</td>
                    <td>{item.enrollment_count}</td>
                    <td className="nowrap">{formatDate(item.created_at)}</td>
                    <td className="icon-cell">
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => remove(item)}
                        disabled={item.id === user.id}
                        aria-label={`Delete ${item.full_name}`}
                        title={item.id === user.id ? 'You cannot delete your own account.' : 'Delete user'}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!users && (
                  <tr>
                    <td colSpan={6} className="empty">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form className="card admin-form" onSubmit={addUser}>
          <h2>Add user</h2>
          <div className="field">
            <label className="label" htmlFor="user-name">Full name</label>
            <input
              id="user-name"
              className="input"
              value={form.full_name}
              onChange={setField('full_name')}
              required
              minLength={2}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="user-email">Email</label>
            <input
              id="user-email"
              className="input"
              type="email"
              value={form.email}
              onChange={setField('email')}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="user-password">Password</label>
            <input
              id="user-password"
              className="input"
              type="password"
              value={form.password}
              onChange={setField('password')}
              required
              minLength={4}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="user-role">Role</label>
            <select id="user-role" className="select" value={form.role} onChange={setField('role')}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role[0].toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Adding…' : 'Add user'}
          </button>
        </form>
      </div>
    </>
  )
}
