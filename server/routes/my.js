import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/my/courses', requireAuth, requireRole('instructor'), (req, res) => {
  const courses = db
    .prepare(
      `SELECT co.id, co.title, co.level, co.status, co.updated_at,
         cat.name AS category_name,
         (SELECT COUNT(*) FROM lessons l WHERE l.course_id = co.id) AS lesson_count,
         (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = co.id) AS enrollments_count
       FROM courses co
       JOIN categories cat ON cat.id = co.category_id
       WHERE co.instructor_id = ?
       ORDER BY co.updated_at DESC`,
    )
    .all(req.user.id)
  res.json({ courses })
})

router.get('/my/enrollments', requireAuth, requireRole('student'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT co.id AS course_id, co.title, co.level,
         u.full_name AS instructor_name, cat.name AS category_name, e.enrolled_at,
         (SELECT COUNT(*) FROM lessons l WHERE l.course_id = co.id) AS total,
         (SELECT COUNT(*) FROM lesson_completions lc
            JOIN lessons l ON l.id = lc.lesson_id
           WHERE l.course_id = co.id AND lc.student_id = e.student_id) AS completed,
         (SELECT MAX(lc.completed_at) FROM lesson_completions lc
            JOIN lessons l ON l.id = lc.lesson_id
           WHERE l.course_id = co.id AND lc.student_id = e.student_id) AS last_activity
       FROM enrollments e
       JOIN courses co ON co.id = e.course_id
       JOIN users u ON u.id = co.instructor_id
       JOIN categories cat ON cat.id = co.category_id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at`,
    )
    .all(req.user.id)

  const nextLesson = db.prepare(
    `SELECT l.id, l.title, l.position, l.duration_min
     FROM lessons l
     WHERE l.course_id = ?
       AND l.id NOT IN (SELECT lesson_id FROM lesson_completions WHERE student_id = ?)
     ORDER BY l.position LIMIT 1`,
  )

  const enrollments = rows.map((row) => {
    let status = 'in_progress'
    if (row.total > 0 && row.completed === row.total) status = 'completed'
    else if (row.completed === 0) status = 'not_started'
    return { ...row, status, next_lesson: nextLesson.get(row.course_id, req.user.id) ?? null }
  })

  res.json({ enrollments })
})

export default router
