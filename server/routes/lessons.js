import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

function findLesson(id) {
  return db
    .prepare(
      `SELECT l.*, co.title AS course_title, co.instructor_id, co.status AS course_status
       FROM lessons l JOIN courses co ON co.id = l.course_id
       WHERE l.id = ?`,
    )
    .get(id)
}

function touchCourse(courseId) {
  db.prepare("UPDATE courses SET updated_at = datetime('now') WHERE id = ?").run(courseId)
}

function readLessonInput(body, existing = {}) {
  const data = {
    title: String(body.title ?? existing.title ?? '').trim(),
    content: String(body.content ?? existing.content ?? '').trim(),
    duration_min: Number(body.duration_min ?? existing.duration_min ?? 15),
  }
  if (data.title.length < 2 || data.title.length > 120) {
    return { error: 'Lesson title must be between 2 and 120 characters.' }
  }
  if (data.content.length > 5000) {
    return { error: 'Lesson text can be at most 5000 characters.' }
  }
  if (!Number.isInteger(data.duration_min) || data.duration_min < 1 || data.duration_min > 600) {
    return { error: 'Duration must be a whole number of minutes (1–600).' }
  }
  return { data }
}

router.post('/courses/:courseId/lessons', requireAuth, requireRole('instructor'), (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(Number(req.params.courseId))
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  if (course.instructor_id !== req.user.id) {
    return res.status(403).json({ error: 'This course belongs to another instructor.' })
  }

  const { data, error } = readLessonInput(req.body ?? {})
  if (error) return res.status(400).json({ error })

  const { last } = db
    .prepare('SELECT COALESCE(MAX(position), 0) AS last FROM lessons WHERE course_id = ?')
    .get(course.id)
  const result = db
    .prepare('INSERT INTO lessons (course_id, title, content, duration_min, position) VALUES (?, ?, ?, ?, ?)')
    .run(course.id, data.title, data.content, data.duration_min, last + 1)

  touchCourse(course.id)
  res.status(201).json({ lesson: findLesson(Number(result.lastInsertRowid)) })
})

router.put('/lessons/:id', requireAuth, requireRole('instructor'), (req, res) => {
  const lesson = findLesson(Number(req.params.id))
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })
  if (lesson.instructor_id !== req.user.id) {
    return res.status(403).json({ error: 'This lesson belongs to another instructor.' })
  }

  const { data, error } = readLessonInput(req.body ?? {}, lesson)
  if (error) return res.status(400).json({ error })

  db.prepare('UPDATE lessons SET title = ?, content = ?, duration_min = ? WHERE id = ?').run(
    data.title,
    data.content,
    data.duration_min,
    lesson.id,
  )
  touchCourse(lesson.course_id)
  res.json({ lesson: findLesson(lesson.id) })
})

router.delete('/lessons/:id', requireAuth, requireRole('instructor'), (req, res) => {
  const lesson = findLesson(Number(req.params.id))
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })
  if (lesson.instructor_id !== req.user.id) {
    return res.status(403).json({ error: 'This lesson belongs to another instructor.' })
  }

  db.prepare('DELETE FROM lessons WHERE id = ?').run(lesson.id)
  db.prepare('UPDATE lessons SET position = position - 1 WHERE course_id = ? AND position > ?').run(
    lesson.course_id,
    lesson.position,
  )
  touchCourse(lesson.course_id)
  res.json({ ok: true })
})

// Reading a lesson requires access to the course.
router.get('/lessons/:id', requireAuth, (req, res) => {
  const lesson = findLesson(Number(req.params.id))
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })

  const isOwner = lesson.instructor_id === req.user.id
  const isAdmin = req.user.role === 'admin'
  const enrolled = Boolean(
    db
      .prepare('SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?')
      .get(req.user.id, lesson.course_id),
  )
  if (lesson.course_status !== 'published' && !isOwner && !isAdmin) {
    return res.status(404).json({ error: 'Lesson not found.' })
  }
  if (!enrolled && !isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Enroll in the course to open its lessons.' })
  }

  const neighbours = db
    .prepare('SELECT id, title, position FROM lessons WHERE course_id = ? ORDER BY position')
    .all(lesson.course_id)
  const index = neighbours.findIndex((item) => item.id === lesson.id)

  const { total } = db
    .prepare('SELECT COUNT(*) AS total FROM lessons WHERE course_id = ?')
    .get(lesson.course_id)
  const { completed } = db
    .prepare(
      `SELECT COUNT(*) AS completed FROM lesson_completions lc
       JOIN lessons l ON l.id = lc.lesson_id
       WHERE l.course_id = ? AND lc.student_id = ?`,
    )
    .get(lesson.course_id, req.user.id)

  res.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      duration_min: lesson.duration_min,
      position: lesson.position,
    },
    course: { id: lesson.course_id, title: lesson.course_title },
    completed: Boolean(
      db
        .prepare('SELECT 1 FROM lesson_completions WHERE student_id = ? AND lesson_id = ?')
        .get(req.user.id, lesson.id),
    ),
    prev_id: neighbours[index - 1]?.id ?? null,
    next_id: neighbours[index + 1]?.id ?? null,
    progress: { completed, total },
    can_track: !isOwner && !isAdmin,
  })
})

router.post('/lessons/:id/complete', requireAuth, requireRole('student'), (req, res) => {
  const lesson = findLesson(Number(req.params.id))
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })

  const enrolled = db
    .prepare('SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?')
    .get(req.user.id, lesson.course_id)
  if (!enrolled) {
    return res.status(403).json({ error: 'Enroll in the course to track progress.' })
  }
  if (lesson.course_status !== 'published') {
    return res.status(400).json({ error: 'This course is not published.' })
  }

  db.prepare('INSERT OR IGNORE INTO lesson_completions (student_id, lesson_id) VALUES (?, ?)').run(
    req.user.id,
    lesson.id,
  )
  res.json({ completed: true })
})

router.delete('/lessons/:id/complete', requireAuth, requireRole('student'), (req, res) => {
  db.prepare('DELETE FROM lesson_completions WHERE student_id = ? AND lesson_id = ?').run(
    req.user.id,
    Number(req.params.id),
  )
  res.json({ completed: false })
})

export default router
