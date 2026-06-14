import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { query } from './db.js'
import { signToken, requireAuth } from './auth.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/

app.get('/health', (_req, res) => res.json({ ok: true }))

// ---- Auth ----

app.post('/auth/register', async (req, res) => {
  const { username, password, email } = req.body || {}
  if (!USERNAME_RE.test(username || '')) {
    return res.status(400).json({ error: 'Username must be 3–30 chars: letters, numbers, underscore.' })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await query(
      `INSERT INTO users (username, password_hash, email)
       VALUES ($1, $2, $3) RETURNING id, username`,
      [username, hash, email || null],
    )
    const user = rows[0]
    await query(`INSERT INTO user_state (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id])
    res.json({ token: signToken(user), username: user.username })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken.' })
    console.error(err)
    res.status(500).json({ error: 'Registration failed.' })
  }
})

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  try {
    const { rows } = await query(
      `SELECT id, username, password_hash FROM users WHERE username = $1`,
      [username],
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }
    res.json({ token: signToken(user), username: user.username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed.' })
  }
})

// ---- State sync (single source of truth, PRD §5.2) ----

// Fetch the user's current state snapshot + version.
app.get('/state', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT state, version FROM user_state WHERE user_id = $1`,
      [req.user.id],
    )
    if (!rows[0]) return res.json({ state: null, version: 0 })
    res.json({ state: rows[0].state, version: Number(rows[0].version) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load state.' })
  }
})

// Push a new snapshot. Last-write-wins guarded by an optimistic version check.
app.put('/state', requireAuth, async (req, res) => {
  const { state, baseVersion } = req.body || {}
  if (typeof state !== 'object' || state === null) {
    return res.status(400).json({ error: 'state must be an object.' })
  }
  try {
    const { rows: cur } = await query(
      `SELECT version FROM user_state WHERE user_id = $1`,
      [req.user.id],
    )
    const currentVersion = cur[0] ? Number(cur[0].version) : 0
    if (typeof baseVersion === 'number' && baseVersion < currentVersion) {
      // The server moved ahead since the client last synced.
      return res.status(409).json({ error: 'stale', currentVersion })
    }
    const { rows } = await query(
      `INSERT INTO user_state (user_id, state, version, updated_at)
       VALUES ($1, $2, 1, now())
       ON CONFLICT (user_id)
       DO UPDATE SET state = $2, version = user_state.version + 1, updated_at = now()
       RETURNING version`,
      [req.user.id, state],
    )
    res.json({ version: Number(rows[0].version) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not save state.' })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`BountyTimer API listening on :${port}`))
