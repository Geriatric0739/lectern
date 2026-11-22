import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import Avatar from './Avatar.jsx'

const NAV = {
  student: [
    ['/courses', 'Courses'],
    ['/my-learning', 'My learning'],
  ],
  instructor: [
    ['/courses', 'Courses'],
    ['/my-courses', 'My courses'],
  ],
  admin: [
    ['/courses', 'Courses'],
    ['/admin/categories', 'Categories'],
    ['/admin/users', 'Users'],
  ],
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = NAV[user?.role] ?? []

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/courses" className="logo">
            Lectern
          </Link>
          <nav className="mainnav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
          {user && (
            <div className="topbar-user">
              <Avatar name={user.full_name} />
              <div className="user-meta">
                <strong>{user.full_name}</strong>
                <span>{user.role[0].toUpperCase() + user.role.slice(1)}</span>
              </div>
              <button type="button" className="btn-link" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  )
}
