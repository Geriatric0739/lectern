import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import Badge from '../components/Badge.jsx'
import Icon from '../components/Icon.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { formatDate, formatMinutes, plural } from '../lib/format.js'

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setData(await api(`/courses/${id}`))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function enroll() {
    setBusy(true)
    try {
      await api(`/courses/${id}/enroll`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function completeLesson(lessonId) {
    try {
      await api(`/lessons/${lessonId}/complete`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!data) {
    return (
      <>
        <p className="crumb">
          <Link to="/courses">Courses</Link>
        </p>
        <div className="card card-pad">{error || 'Loading…'}</div>
      </>
    )
  }

  const { course, lessons, enrolled, is_owner, progress } = data
  const nextLesson = lessons.find((lesson) => !lesson.completed)
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.duration_min, 0)
  const visibleLessons = showAll ? lessons : lessons.slice(0, 8)
  const isStudent = user.role === 'student'
  const words = course.title.split(' ')
  const lastWord = words.pop()

  return (
    <>
      <p className="crumb">
        <Link to="/courses">Courses</Link> / {course.title}
      </p>

      <h1 className="detail-title">
        {words.join(' ')}{' '}
        <span className="hl">{lastWord}</span>
      </h1>

      <div className="detail-meta">
        <span className="level-dot">{course.level}</span>
        <span>{course.category_name}</span>
        <span>{plural(lessons.length, 'lesson')}</span>
        <span>about {formatMinutes(totalMinutes)}</span>
        <span>Taught by {course.instructor_name}</span>
      </div>

      <section className="card progress-card">
        <div style={{ flex: 1 }}>
          {enrolled && isStudent && (
            <>
              <p className="kicker">Your progress</p>
              <h2>
                {progress.completed} of {progress.total} lessons completed
              </h2>
              <ProgressBar completed={progress.completed} total={progress.total} />
            </>
          )}

          {!enrolled && isStudent && (
            <>
              <p className="kicker">Not enrolled yet</p>
              <h2>Enrol to track your progress</h2>
              <p className="muted small">You get access to every lesson and a progress bar.</p>
            </>
          )}

          {!isStudent && (
            <>
              <p className="kicker">{is_owner ? 'Your course' : 'Course overview'}</p>
              <h2>{plural(course.enrollments_count, 'student')} enrolled</h2>
              <p className="muted small">
                {course.status === 'published' ? 'Published in the catalogue.' : 'This course is a draft.'}
              </p>
            </>
          )}
        </div>

        {isStudent && !enrolled && (
          <button type="button" className="btn btn-primary" onClick={enroll} disabled={busy}>
            {busy ? 'Enrolling…' : 'Enrol in course'}
          </button>
        )}

        {isStudent && enrolled && lessons.length > 0 && (
          <Link
            className="btn btn-primary"
            to={`/courses/${course.id}/lessons/${(nextLesson ?? lessons[0]).id}`}
          >
            {nextLesson ? `Continue with lesson ${nextLesson.position}` : 'Review the course'}
          </Link>
        )}

        {is_owner && (
          <Link className="btn btn-outline" to={`/my-courses/${course.id}/edit`}>
            Edit course
          </Link>
        )}
      </section>

      {error && <p className="error-text">{error}</p>}

      <div className="grid-main">
        <div>
          <div className="row-between" style={{ marginBottom: '14px' }}>
            <h2 className="section-title">Lessons</h2>
            <span className="section-note">Mark a lesson complete after you finish it</span>
          </div>

          <div className="lesson-list">
            {visibleLessons.map((lesson, index) => {
              const isNext = lesson.id === nextLesson?.id
              return (
                <div key={lesson.id} className={isNext && enrolled ? 'lesson-row next' : 'lesson-row'}>
                  <span className={lesson.completed ? 'lesson-check done' : 'lesson-check'}>
                    {lesson.completed && <Icon name="check" size={12} strokeWidth={2.4} />}
                  </span>
                  <span className="lesson-num">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    {isNext && enrolled && <span className="lesson-kicker">Up next</span>}
                    {lesson.completed || enrolled || !isStudent ? (
                      <Link
                        to={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="lesson-title"
                      >
                        {lesson.title}
                      </Link>
                    ) : (
                      <span className="lesson-title">{lesson.title}</span>
                    )}
                  </div>
                  <span className="lesson-duration">{lesson.duration_min} min</span>
                  <div className="lesson-action">
                    {isStudent && !enrolled ? (
                      <span className="muted small">Enrol to open</span>
                    ) : lesson.completed ? (
                      <span className="done-label">
                        <Icon name="check" size={13} strokeWidth={2.4} /> Completed
                      </span>
                    ) : isStudent && enrolled && isNext ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => completeLesson(lesson.id)}
                      >
                        Mark complete
                      </button>
                    ) : (
                      <Link to={`/courses/${course.id}/lessons/${lesson.id}`}>Open lesson</Link>
                    )}
                  </div>
                </div>
              )
            })}

            {lessons.length === 0 && (
              <div className="empty">
                {is_owner ? 'Add a lesson to get this course ready.' : 'No lessons yet.'}
              </div>
            )}

            {lessons.length > 8 && (
              <div className="lesson-more">
                <button type="button" className="btn-link" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show fewer lessons' : `Show the remaining ${lessons.length - 8} lessons`}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="card sidebar-card">
          <h2>About this course</h2>
          <p className="muted" style={{ marginBottom: '18px' }}>
            {course.description || 'No description yet.'}
          </p>
          <dl className="info-list">
            <div className="info-row">
              <dt>Instructor</dt>
              <dd>{course.instructor_name}</dd>
            </div>
            <div className="info-row">
              <dt>Category</dt>
              <dd>{course.category_name}</dd>
            </div>
            <div className="info-row">
              <dt>Level</dt>
              <dd>{course.level}</dd>
            </div>
            <div className="info-row">
              <dt>Lessons</dt>
              <dd>{lessons.length}</dd>
            </div>
            <div className="info-row">
              <dt>Enrolled</dt>
              <dd>{plural(course.enrollments_count, 'student')}</dd>
            </div>
            <div className="info-row">
              <dt>Updated</dt>
              <dd>{formatDate(course.updated_at)}</dd>
            </div>
            {course.status !== 'published' && (
              <div className="info-row">
                <dt>Status</dt>
                <dd>
                  <Badge tone="warning">Draft</Badge>
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </>
  )
}
