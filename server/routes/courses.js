import { Router } from 'express'
import { db } from '../db.js'
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

function findCourse(id) {
  return db
    .prepare(
      `SELECT co.*, cat.name AS category_name, u.full_name AS instructor_name,
         (SELECT COUNT(*) FROM lessons l WHERE l.course_id = co.id) AS lesson_count,
         (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = co.id) AS enrollments_count
       FROM courses co
       JOIN categories cat ON cat.id = co.category_id
       JOIN users u ON u.id = co.instructor_id
       WHERE co.id = ?`,
    )
    .get(id)
}

function readInput(body, existing = {}) {
  const data = {
    title: String(body.title ?? existing.title ?? '').trim(),
    description: String(body.description ?? existing.description ?? '').trim(),
    category_id: Number(body.category_id ?? existing.category_id ?? 0),
    level: body.level ?? existing.level ?? 'Beginner',
    status: body.status ?? existing.status ?? 'draft',
  }
  if (data.title.length < 3 || data.title.length > 80) {
    return { error: 'Title must be between 3 and 80 characters.' }
  }
  if (data.description.length > 600) {
    return { error: 'Description can be at most 600 characters.' }
  }
  if (!LEVELS.includes(data.level)) return { error: 'Choose a valid level.' }
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(data.category_id)) {
    return { error: 'Choose a category.' }
  }
  if (!['draft', 'published'].includes(data.status)) return { error: 'Choose a valid status.' }
  return { data }
}

function loadOwnedCourse(req, res) {
  const course = findCourse(Number(req.params.id))
  if (!course) {
    res.status(404).json({ error: 'Course not found.' })
    return null
  }
  if (course.instructor_id !== req.user.id) {
    res.status(403).json({ error: 'This course belongs to another instructor.' })
    return null
  }
  return course
}

// Catalogue: published courses only.
router.get('/', optionalAuth, (req, res) => {
  const search = String(req.query.search ?? '').trim()
  const category = Number(req.query.category) || 0
  const level = String(req.query.level ?? '')
  const page = Math.max(1, Number(req.query.page) || 1)
  const perPage = Math.min(50, Math.max(1, Number(req.query.per_page) || 8))

  const where = ["co.status = 'published'"]
  const params = []
  if (search) {
    where.push('(co.title LIKE ? OR u.full_name LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  if (category) {
    where.push('co.category_id = ?')
    params.push(category)
  }
  if (LEVELS.includes(level)) {
    where.push('co.level = ?')
    params.push(level)
  }
  const whereSql = where.join(' AND ')

  const { n: total } = db
    .prepare(`SELECT COUNT(*) AS n FROM courses co JOIN users u ON u.id = co.instructor_id WHERE ${whereSql}`)
    .get(...params)

  const studentId = req.user?.role === 'student' ? req.user.id : 0
  const courses = db
    .prepare(
      `SELECT co.id, co.title, co.description, co.level, co.category_id, co.updated_at,
         cat.name AS category_name, u.full_name AS instructor_name,
         (SELECT COUNT(*) FROM lessons l WHERE l.course_id = co.id) AS lesson_count,
         EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = co.id AND e.student_id = ?) AS enrolled
       FROM courses co
       JOIN categories cat ON cat.id = co.category_id
       JOIN users u ON u.id = co.instructor_id
       WHERE ${whereSql}
       ORDER BY co.id
       LIMIT ? OFFSET ?`,
    )
    .all(studentId, ...params, perPage, (page - 1) * perPage)

  res.json({ courses, total, page, per_page: perPage })
})

router.get('/:id', optionalAuth, (req, res) => {
  const course = findCourse(Number(req.params.id))
  if (!course) return res.status(404).json({ error: 'Course not found.' })

  const user = req.user
  const isOwner = user?.id === course.instructor_id
  const isAdmin = user?.role === 'admin'
  if (course.status !== 'published' && !isOwner && !isAdmin) {
    return res.status(404).json({ error: 'Course not found.' })
  }

  const enrolled = Boolean(
    user && db.prepare('SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, course.id),
  )
  const lessons = db
    .prepare(
      `SELECT l.id, l.title, l.duration_min, l.position,
         EXISTS (SELECT 1 FROM lesson_completions lc
                 WHERE lc.lesson_id = l.id AND lc.student_id = ?) AS completed
       FROM lessons l WHERE l.course_id = ? ORDER BY l.position`,
    )
    .all(user?.id ?? 0, course.id)

  res.json({
    course,
    lessons,
    enrolled,
    is_owner: isOwner,
    progress: {
      completed: lessons.filter((lesson) => lesson.completed).length,
      total: lessons.length,
    },
  })
})

router.post('/', requireAuth, requireRole('instructor'), (req, res) => {
  const { data, error } = readInput(req.body ?? {})
  if (error) return res.status(400).json({ error })

  const result = db
    .prepare(
      `INSERT INTO courses (title, description, category_id, instructor_id, level, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
    )
    .run(data.title, data.description, data.category_id, req.user.id, data.level)
  res.status(201).json({ course: findCourse(Number(result.lastInsertRowid)) })
})

router.put('/:id', requireAuth, requireRole('instructor'), (req, res) => {
  const course = loadOwnedCourse(req, res)
  if (!course) return

  const { data, error } = readInput(req.body ?? {}, course)
  if (error) return res.status(400).json({ error })
  if (data.status === 'published' && course.lesson_count === 0) {
    return res.status(400).json({ error: 'Add at least one lesson before publishing.' })
  }

  db.prepare(
    `UPDATE courses
     SET title = ?, description = ?, category_id = ?, level = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(data.title, data.description, data.category_id, data.level, data.status, course.id)

  res.json({ course: findCourse(course.id) })
})

router.delete('/:id', requireAuth, requireRole('instructor'), (req, res) => {
  const course = loadOwnedCourse(req, res)
  if (!course) return
  db.prepare('DELETE FROM courses WHERE id = ?').run(course.id)
  res.json({ ok: true })
})

// Enrolled students, with progress per student.
router.get('/:id/students', requireAuth, (req, res) => {
  const course = findCourse(Number(req.params.id))
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  if (course.instructor_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'This course belongs to another instructor.' })
  }

  const students = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, e.enrolled_at,
         (SELECT COUNT(*) FROM lessons l WHERE l.course_id = e.course_id) AS total,
         (SELECT COUNT(*) FROM lesson_completions lc
            JOIN lessons l ON l.id = lc.lesson_id
           WHERE l.course_id = e.course_id AND lc.student_id = u.id) AS completed,
         (SELECT MAX(lc.completed_at) FROM lesson_completions lc
            JOIN lessons l ON l.id = lc.lesson_id
           WHERE l.course_id = e.course_id AND lc.student_id = u.id) AS last_activity
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at`,
    )
    .all(course.id)

  res.json({ course, students })
})

router.post('/:id/enroll', requireAuth, requireRole('student'), (req, res) => {
  const course = findCourse(Number(req.params.id))
  if (!course || course.status !== 'published') {
    return res.status(404).json({ error: 'Course not found.' })
  }
  if (db.prepare('SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?').get(req.user.id, course.id)) {
    return res.status(409).json({ error: 'You are already enrolled in this course.' })
  }
  const result = db
    .prepare('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)')
    .run(req.user.id, course.id)
  res.status(201).json({ enrollment: { id: Number(result.lastInsertRowid), course_id: course.id } })
})

export default router
