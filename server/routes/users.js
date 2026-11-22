import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
const ROLES = ['student', 'instructor', 'admin']

router.get('/', requireAuth, requireRole('admin'), (_req, res) => {
  const users = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.role, u.created_at,
         (SELECT COUNT(*) FROM courses c WHERE c.instructor_id = u.id) AS course_count,
         (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = u.id) AS enrollment_count
       FROM users u
       ORDER BY u.id`,
    )
    .all()
  res.json({ users })
})

router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const full_name = String(req.body?.full_name ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const role = req.body?.role

  if (full_name.length < 2) return res.status(400).json({ error: 'Full name is required.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' })
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Choose a valid role.' })

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (exists) return res.status(409).json({ error: 'An account with this email already exists.' })

  const hash = bcrypt.hashSync(password, 10)
  const result = db
    .prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(full_name, email, hash, role)
  const user = db
    .prepare('SELECT id, full_name, email, role, created_at FROM users WHERE id = ?')
    .get(Number(result.lastInsertRowid))
  res.status(201).json({ user: { ...user, course_count: 0, enrollment_count: 0 } })
})

router.put('/:id/role', requireAuth, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const role = req.body?.role

  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Choose a valid role.' })
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot change your own role.' })

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id)
  if (!user) return res.status(404).json({ error: 'User not found.' })

  if (user.role === 'admin' && role !== 'admin') {
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get()
    if (n <= 1) return res.status(400).json({ error: 'At least one admin must remain.' })
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
  res.json({ ok: true })
})

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' })

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id)
  if (!user) return res.status(404).json({ error: 'User not found.' })

  if (user.role === 'admin') {
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get()
    if (n <= 1) return res.status(400).json({ error: 'At least one admin must remain.' })
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id)
  res.json({ ok: true })
})

export default router
