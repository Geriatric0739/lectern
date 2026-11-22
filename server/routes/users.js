import { Router } from 'express'
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

export default router
