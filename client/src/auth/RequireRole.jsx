import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="boot">Loading…</div>

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <main className="page">
        <div className="card card-pad">
          <h1 className="page-title">Not available</h1>
          <p className="page-sub">Your account does not have access to this page.</p>
          <p style={{ marginTop: '18px' }}>
            <Link to="/courses">Back to courses</Link>
          </p>
        </div>
      </main>
    )
  }

  return children
}
