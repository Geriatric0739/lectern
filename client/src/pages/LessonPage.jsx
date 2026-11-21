import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import Icon from '../components/Icon.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

export default function LessonPage() {
  const { id, lessonId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setData(await api(`/lessons/${lessonId}`))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [lessonId])

  async function toggleComplete() {
    setBusy(true)
    try {
      await api(`/lessons/${lessonId}/complete`, {
        method: data.completed ? 'DELETE' : 'POST',
      })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <>
        <p className="crumb">
          <Link to="/courses">Courses</Link>
        </p>
        <div className="card card-pad">{error}</div>
      </>
    )
  }

  if (!data) return <p className="muted">Loading…</p>

  const { lesson, course, completed, prev_id, next_id, progress, can_track } = data

  return (
    <>
      <p className="crumb">
        <Link to="/courses">Courses</Link> / <Link to={`/courses/${course.id}`}>{course.title}</Link>
      </p>

      <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: '22px' }}>
        <div>
          <p className="lesson-kicker">
            Lesson {lesson.position} of {progress.total} · {lesson.duration_min} min
          </p>
          <h1 className="detail-title" style={{ fontSize: '32px' }}>
            {lesson.title}
          </h1>
        </div>
        {can_track && (
          <button type="button" className="btn btn-primary" onClick={toggleComplete} disabled={busy}>
            {completed ? 'Mark as not complete' : 'Mark complete'}
          </button>
        )}
      </div>

      <div className="card card-pad" style={{ marginBottom: '22px' }}>
        {lesson.content.split(/\n+/).map((paragraph, index) => (
          <p key={index} style={{ marginBottom: '14px' }}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className="card card-pad" style={{ marginBottom: '22px' }}>
        <div className="row-between" style={{ marginBottom: '10px' }}>
          <span className="small muted">Course progress</span>
          <span className="small muted">
            {progress.completed} of {progress.total} lessons completed
          </span>
        </div>
        <ProgressBar completed={progress.completed} total={progress.total} />
      </div>

      <div className="row-between">
        <div>
          {prev_id && (
            <Link className="btn btn-outline" to={`/courses/${id}/lessons/${prev_id}`}>
              ← Previous lesson
            </Link>
          )}
        </div>
        <div className="row">
          <Link className="btn btn-outline" to={`/courses/${course.id}`}>
            Back to course
          </Link>
          {next_id && (
            <Link className="btn btn-primary" to={`/courses/${id}/lessons/${next_id}`}>
              Next lesson →
            </Link>
          )}
        </div>
      </div>

      {completed && can_track && (
        <p className="success-text" style={{ marginTop: '18px' }}>
          <Icon name="check" size={13} strokeWidth={2.4} /> You marked this lesson complete.
        </p>
      )}
    </>
  )
}
