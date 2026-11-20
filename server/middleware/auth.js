import jwt from 'jsonwebtoken'
import { db } from '../db.js'

export const COOKIE_NAME = 'lectern_session'
const SECRET = process.env.JWT_SECRET ?? 'lectern-development-secret'
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000

export function setSession(res, user) {
  const token = jwt.sign({ uid: user.id }, SECRET, { expiresIn: '7d' })
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_AGE,
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' })
}

function readUser(req) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return null
  try {
    const { uid } = jwt.verify(token, SECRET)
    return (
      db
        .prepare('SELECT id, full_name, email, role, created_at FROM users WHERE id = ?')
        .get(uid) ?? null
    )
  } catch {
    return null
  }
}

export function optionalAuth(req, _res, next) {
  req.user = readUser(req)
  next()
}

export function requireAuth(req, res, next) {
  req.user = readUser(req)
  if (!req.user) return res.status(401).json({ error: 'Please sign in first.' })
  next()
}

// Usage: router.get('/x', requireAuth, requireRole('instructor'), handler)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this action.' })
    }
    next()
  }
}
