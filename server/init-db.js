import { ensureDatabase, migrate, seed, dbFile } from './db.js'

const reset = process.argv.includes('--reset')

if (reset) {
  migrate({ force: true })
  seed()
  console.log(`Database recreated with seed data: ${dbFile}`)
} else {
  ensureDatabase()
  console.log(`Database ready: ${dbFile}`)
}
