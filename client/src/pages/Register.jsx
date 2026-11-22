import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { HOME_BY_ROLE, useAuth } from '../auth/AuthContext.jsx'
import AuthSide from '../auth/AuthSide.jsx'

const ROLES = [
  ['student', 'Student', 'Enroll in courses and track progress'],
  ['instructor', 'Instructor', 'Create courses and lessons'],
]

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const account = await register({ ...form, email: form.email.trim() })
      navigate(HOME_BY_ROLE[account.role], { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <AuthSide mode="register" />

      <main className="auth-main">
        <div className="auth-form">
          <h1>
            <span className="hl">Create an account</span>
          </h1>
          <p className="page-sub">
            Passwords are stored hashed. You can change your role only through an admin.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="input"
                placeholder="Nino Kapanadze"
                value={form.full_name}
                onChange={update('full_name')}
                required
                minLength={2}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="name@iliauni.edu.ge"
                value={form.email}
                onChange={update('email')}
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
              />
              <span className="hint">Use letters and numbers.</span>
            </div>

            <div className="field">
              <span className="label">I am joining as</span>
              {ROLES.map(([value, title, description]) => (
                <label
                  key={value}
                  className={form.role === value ? 'radio-card selected' : 'radio-card'}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={form.role === value}
                    onChange={update('role')}
                  />
                  <span>
                    <strong>{title}</strong>
                    {description}
                  </span>
                </label>
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
