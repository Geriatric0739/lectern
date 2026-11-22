import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { HOME_BY_ROLE, useAuth } from '../auth/AuthContext.jsx'
import AuthSide from '../auth/AuthSide.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const account = await login(email.trim(), password)
      navigate(HOME_BY_ROLE[account.role], { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <AuthSide mode="login" />

      <main className="auth-main">
        <div className="auth-form">
          <h1>
            <span className="hl">Sign in</span>
          </h1>
          <p className="page-sub">Enter your email and password to open your courses.</p>

          <form onSubmit={handleSubmit}>
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '6px' }} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            New to Lectern? <Link to="/register">Create an account</Link>
          </p>

          <div className="demo-accounts">
            <strong>Demo accounts</strong>
            <span>Student — student@example.com / student</span>
            <span>Instructor — instructor@example.com / instructor</span>
            <span>Admin — admin@example.com / admin</span>
          </div>
        </div>
      </main>
    </div>
  )
}
