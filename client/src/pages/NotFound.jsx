import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page">
      <div className="card card-pad">
        <h1 className="page-title">Page not found</h1>
        <p className="page-sub">The page you asked for does not exist.</p>
        <p style={{ marginTop: '18px' }}>
          <Link to="/courses">Back to courses</Link>
        </p>
      </div>
    </main>
  )
}
