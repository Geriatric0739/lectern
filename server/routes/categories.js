import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
const adminOnly = [requireAuth, requireRole('admin')]

const SELECT_CATEGORIES = `
  SELECT c.id, c.name, c.created_at, COUNT(co.id) AS course_count
  FROM categories c
  LEFT JOIN courses co ON co.category_id = c.id
  GROUP BY c.id
  ORDER BY c.name COLLATE NOCASE`

router.get('/', (_req, res) => {
  res.json({ categories: db.prepare(SELECT_CATEGORIES).all() })
})

router.post('/', adminOnly, (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: 'Category name must be 2–50 characters.' })
  }
  if (db.prepare('SELECT 1 FROM categories WHERE name = ? COLLATE NOCASE').get(name)) {
    return res.status(409).json({ error: 'That category already exists.' })
  }
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name)
  const category = db.prepare(SELECT_CATEGORIES.replace('GROUP BY c.id', 'WHERE c.id = ? GROUP BY c.id')).get(result.lastInsertRowid)
  res.status(201).json({ category })
})

router.put('/:id', adminOnly, (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  const id = Number(req.params.id)
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: 'Category name must be 2–50 characters.' })
  }
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Category not found.' })
  }
  if (db.prepare('SELECT 1 FROM categories WHERE name = ? COLLATE NOCASE AND id <> ?').get(name, id)) {
    return res.status(409).json({ error: 'That category already exists.' })
  }
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id)
  res.json({ ok: true })
})

router.delete('/:id', adminOnly, (req, res) => {
  const id = Number(req.params.id)
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Category not found.' })
  }
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM courses WHERE category_id = ?').get(id)
  if (n > 0) {
    return res.status(409).json({ error: `This category still has ${n} course${n === 1 ? '' : 's'}.` })
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  res.json({ ok: true })
})

export default router
