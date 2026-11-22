import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import Badge from '../components/Badge.jsx'
import Icon from '../components/Icon.jsx'
import { plural } from '../lib/format.js'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function CourseEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(null)
  const [lessonForm, setLessonForm] = useState(null)
  const [error, setError] = useState('')
  const [lessonError, setLessonError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const data = await api(`/courses/${id}`)
      setCourse(data.course)
      setLessons(data.lessons)
      setForm({
        title: data.course.title,
        description: data.course.description,
        category_id: String(data.course.category_id),
        level: data.course.level,
        status: data.course.status,
      })
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    api('/categories')
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories([]))
  }, [id])

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  async function save(status) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const payload = { ...form, status, category_id: Number(form.category_id) }
      const data = await api(`/courses/${id}`, { method: 'PUT', body: payload })
      setCourse(data.course)
      setForm({ ...form, status: data.course.status })
      setNotice(status === 'published' ? 'Course published.' : 'Changes saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteCourse() {
    if (!window.confirm(`Delete "${course.title}"? Its lessons and enrollments are removed too.`)) {
      return
    }
    try {
      await api(`/courses/${id}`, { method: 'DELETE' })
      navigate('/my-courses')
    } catch (err) {
      setError(err.message)
    }
  }

  function startAddLesson() {
    setLessonError('')
    setLessonForm({ id: null, title: '', duration_min: 15, content: '' })
  }

  async function startEditLesson(lesson) {
    setLessonError('')
    try {
      const data = await api(`/lessons/${lesson.id}`)
      setLessonForm({
        id: lesson.id,
        title: data.lesson.title,
        duration_min: data.lesson.duration_min,
        content: data.lesson.content,
      })
    } catch (err) {
      setLessonError(err.message)
    }
  }

  async function saveLesson(event) {
    event.preventDefault()
    setLessonError('')
    const body = {
      title: lessonForm.title,
      content: lessonForm.content,
      duration_min: Number(lessonForm.duration_min),
    }
    try {
      if (lessonForm.id) {
        await api(`/lessons/${lessonForm.id}`, { method: 'PUT', body })
      } else {
        await api(`/courses/${id}/lessons`, { method: 'POST', body })
      }
      setLessonForm(null)
      await load()
    } catch (err) {
      setLessonError(err.message)
    }
  }

  async function removeLesson(lesson) {
    if (!window.confirm(`Delete the lesson "${lesson.title}"?`)) return
    try {
      await api(`/lessons/${lesson.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setLessonError(err.message)
    }
  }

  if (!form) return <p className="muted">{error || 'Loading…'}</p>

  return (
    <>
      <p className="crumb">
        <Link to="/my-courses">My courses</Link> / {course.title}
      </p>

      <div className="editor-head">
        <h1 className="page-title">
          <span className="hl">Edit course</span>
        </h1>
        {course.status === 'published' ? (
          <Badge tone="success">Published</Badge>
        ) : (
          <Badge tone="warning">Draft</Badge>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {notice && <p className="success-text">{notice}</p>}

      <div className="grid-main" style={{ marginTop: '18px' }}>
        <div>
          <section className="card editor-card">
            <h2>Course details</h2>
            <div className="field">
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                className="input"
                value={form.title}
                onChange={update('title')}
                maxLength={80}
                required
              />
              <span className="hint">Shown in the catalogue. 3 to 80 characters.</span>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="category">
                  Category
                </label>
                <select id="category" className="select" value={form.category_id} onChange={update('category_id')}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="level">
                  Level
                </label>
                <select id="level" className="select" value={form.level} onChange={update('level')}>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="textarea"
                value={form.description}
                onChange={update('description')}
                maxLength={600}
              />
              <span className="hint">{form.description.length} of 600 characters</span>
            </div>
          </section>

          <section className="card editor-card">
            <div className="row-between" style={{ marginBottom: '14px' }}>
              <div>
                <h2 style={{ marginBottom: '2px' }}>Lessons</h2>
                <p className="muted small">
                  {plural(lessons.length, 'lesson')}, in the order students will see them
                </p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={startAddLesson}>
                <Icon name="plus" size={13} /> Add lesson
              </button>
            </div>

            {lessonError && <p className="error-text">{lessonError}</p>}

            {lessonForm && (
              <form className="lesson-editor" onSubmit={saveLesson}>
                <div className="grid-2">
                  <div className="field">
                    <label className="label" htmlFor="lesson-title">
                      Lesson title
                    </label>
                    <input
                      id="lesson-title"
                      className="input"
                      value={lessonForm.title}
                      onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })}
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="lesson-duration">
                      Duration (minutes)
                    </label>
                    <input
                      id="lesson-duration"
                      className="input"
                      type="number"
                      min="1"
                      max="600"
                      value={lessonForm.duration_min}
                      onChange={(event) => setLessonForm({ ...lessonForm, duration_min: event.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="lesson-content">
                    Lesson text
                  </label>
                  <textarea
                    id="lesson-content"
                    className="textarea"
                    value={lessonForm.content}
                    onChange={(event) => setLessonForm({ ...lessonForm, content: event.target.value })}
                    placeholder="The notes students read when they open the lesson."
                  />
                </div>
                <div className="row">
                  <button type="submit" className="btn btn-primary btn-sm">
                    {lessonForm.id ? 'Save lesson' : 'Add lesson'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setLessonForm(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {lessons.map((lesson) => (
              <div key={lesson.id} className="editor-lesson-row">
                <span className="num">{String(lesson.position).padStart(2, '0')}</span>
                <span>{lesson.title}</span>
                <span className="muted small">{lesson.duration_min} min</span>
                <div className="actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => startEditLesson(lesson)}
                    aria-label={`Edit ${lesson.title}`}
                  >
                    <Icon name="pencil" size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => removeLesson(lesson)}
                    aria-label={`Delete ${lesson.title}`}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}

            {lessons.length === 0 && !lessonForm && (
              <p className="muted small">No lessons yet. Add at least one before publishing.</p>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="card editor-card" style={{ marginBottom: 0 }}>
            <h2>Publishing</h2>

            <label className={form.status === 'draft' ? 'radio-card selected' : 'radio-card'}>
              <input
                type="radio"
                name="status"
                value="draft"
                checked={form.status === 'draft'}
                onChange={() => save('draft')}
              />
              <span>
                <strong>Draft</strong>
                Only you can see this course
              </span>
            </label>

            <label className={form.status === 'published' ? 'radio-card selected' : 'radio-card'}>
              <input
                type="radio"
                name="status"
                value="published"
                checked={form.status === 'published'}
                onChange={() => save('published')}
              />
              <span>
                <strong>Published</strong>
                Listed in the catalogue; students can enrol
              </span>
            </label>

            <p className="hint" style={{ margin: '14px 0' }}>
              Publishing needs a title, a category and at least one lesson.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => save('published')}
              disabled={busy}
            >
              {course.status === 'published' ? 'Save changes' : 'Publish course'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => save('draft')}
              disabled={busy}
              style={{ marginTop: '10px' }}
            >
              Save draft
            </button>
          </section>

          <section className="card editor-card" style={{ marginBottom: 0 }}>
            <h2>Delete course</h2>
            <p className="muted small" style={{ marginBottom: '14px' }}>
              Removes the course, its lessons and all enrollments. You will be asked to confirm.
            </p>
            <button type="button" className="btn btn-danger btn-block" onClick={deleteCourse}>
              Delete course
            </button>
          </section>
        </aside>
      </div>
    </>
  )
}
