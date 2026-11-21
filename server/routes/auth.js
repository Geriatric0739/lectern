import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { clearSession, optionalAuth, setSession } from '../middleware/auth.js'

const router = Router()
const PUBLIC_FIELDS = 'id, full_name, email, role, created_at'

router.get('/me', optionalAuth, (req, res) => {
  res.json({ user: req.user ?? null })
})

router.post('/register', async (req, res) => {
  const body = req.body ?? {}
  const fullName = String(body.full_name ?? '').trim().replace(/\s+/g, ' ')
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const role = body.role

  if (fullName.length < 2 || fullName.length > 80) {
    return res.status(400).json({ error: 'Full name must be between 2 and 80 characters.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password needs at least 8 characters, letters and numbers.' })
  }
  if (role !== 'student' && role !== 'instructor') {
    return res.status(400).json({ error: 'Choose either a student or an instructor account.' })
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const result = db
    .prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(fullName, email, passwordHash, role)

  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(result.lastInsertRowid)
  setSession(res, user)
  res.status(201).json({ user })
})

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  const valid = row ? await bcrypt.compare(password, row.password_hash) : false
  if (!valid) {
    return res.status(401).json({ error: 'Wrong email or password.' })
  }

  setSession(res, row)
  res.json({
    user: { id: row.id, full_name: row.full_name, email: row.email, role: row.role },
  })
})

router.post('/logout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

export default router
