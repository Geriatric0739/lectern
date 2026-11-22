import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { formatDate } from '../lib/format.js'

const ROLES = ['student', 'instructor', 'admin']

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

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

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          <span className="hl">Users</span>
        </h1>
        <p className="page-sub">
          Roles decide what an account can do. Students enrol, instructors create courses, admins
          manage the catalogue.
        </p>
      </div>

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
              </tr>
            ))}
            {!users && (
              <tr>
                <td colSpan={5} className="empty">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
