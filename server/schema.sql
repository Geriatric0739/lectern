-- Lectern schema (SQLite)
-- Five tables: users, categories, courses, lessons, enrollments + lesson_completions.

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'student'
                        CHECK (role IN ('student', 'instructor', 'admin')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE courses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level         TEXT    NOT NULL DEFAULT 'Beginner'
                        CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  status        TEXT    NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (length(title) BETWEEN 3 AND 80)
);

CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);

CREATE TABLE lessons (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  content      TEXT    NOT NULL DEFAULT '',
  duration_min INTEGER NOT NULL DEFAULT 15
                       CHECK (duration_min BETWEEN 1 AND 600),
  position     INTEGER NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (course_id, position)
);

CREATE INDEX idx_lessons_course ON lessons(course_id);

CREATE TABLE enrollments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_course ON enrollments(course_id);

CREATE TABLE lesson_completions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, lesson_id)
);

CREATE INDEX idx_completions_lesson ON lesson_completions(lesson_id);
