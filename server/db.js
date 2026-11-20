import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'data')
mkdirSync(dataDir, { recursive: true })

export const dbFile = process.env.DB_FILE ?? path.join(dataDir, 'lectern.db')
export const db = new DatabaseSync(dbFile)
db.exec('PRAGMA foreign_keys = ON')

function sql(file) {
  return readFileSync(path.join(root, 'server', file), 'utf8')
}

const TABLES = [
  'lesson_completions',
  'enrollments',
  'lessons',
  'courses',
  'categories',
  'users',
]

export function migrate({ force = false } = {}) {
  if (force) {
    for (const table of TABLES) db.exec(`DROP TABLE IF EXISTS ${table}`)
  }
  db.exec(sql('schema.sql'))
}

export function seed() {
  db.exec(sql('seed.sql'))
}

// Creates the database on first run so a fresh clone only needs `npm run dev`.
export function ensureDatabase() {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get()
  if (row.n === 0) {
    migrate()
    seed()
  }
}
