import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import Avatar from './Avatar.jsx'
import Icon from './Icon.jsx'

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
  const [open, setOpen] = useState(false)
  const links = NAV[user?.role] ?? []

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <>
      <header className={open ? 'topbar menu-open' : 'topbar'}>
        <div className="topbar-inner">
          <Link to="/courses" className="logo" onClick={() => setOpen(false)}>
            Lectern
          </Link>
          <nav className="mainnav" id="mainnav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}
            <button type="button" className="nav-logout btn-link" onClick={handleLogout}>
              Log out
            </button>
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
          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mainnav"
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? 'close' : 'menu'} size={20} />
          </button>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  )
}
