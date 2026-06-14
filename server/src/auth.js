import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me'
// 30-day rolling expiry (PRD §5.1).
const EXPIRY = '30d'

export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, SECRET, {
    expiresIn: EXPIRY,
  })
}

/** Express middleware: require a valid Bearer token, attach req.user. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const payload = jwt.verify(token, SECRET)
    req.user = { id: payload.sub, username: payload.username }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
