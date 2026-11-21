import express from 'express'
import cookieParser from 'cookie-parser'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import courseRoutes from './routes/courses.js'
import lessonRoutes from './routes/lessons.js'
import myRoutes from './routes/my.js'
import userRoutes from './routes/users.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

ensureDatabase()

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/users', userRoutes)
app.use('/api', lessonRoutes)
app.use('/api', myRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' })
})

// In production the built React app is served from client/dist.
const dist = path.join(root, 'client', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status ?? 500).json({ error: 'Something went wrong on the server.' })
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Lectern listening on http://localhost:${port}`)
})
