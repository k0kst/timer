import { useState } from 'react'
import { useAuth } from '../state/auth'

/** Sign-in / sign-up screen (PRD §5.1, Flow C). Shown when a backend is
 *  configured and no valid session exists. */
export function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(username.trim(), password)
      else await register(username.trim(), password, email.trim() || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="card auth-card">
        <div className="brand" style={{ fontSize: 26, marginBottom: 4 }}>
          Bounty<span style={{ color: 'var(--teal)' }}>Timer</span>
        </div>
        <div className="hint" style={{ marginBottom: 18 }}>
          Focus. Earn. Rest. Repeat.
        </div>

        <div className="seg" style={{ marginBottom: 16 }}>
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign in
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Create account
          </button>
        </div>

        <div className="field">
          <label>Username</label>
          <input
            className="input"
            value={username}
            autoCapitalize="none"
            autoCorrect="off"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        {mode === 'register' && (
          <div className="field">
            <label>Email (optional — for recovery)</label>
            <input
              className="input"
              type="email"
              value={email}
              autoCapitalize="none"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="hint" style={{ color: 'var(--red)', marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button className="btn primary" style={{ width: '100%' }} disabled={busy} onClick={submit}>
          {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        {mode === 'register' && (
          <div className="hint" style={{ marginTop: 10 }}>
            Username 3–30 chars (letters, numbers, underscore). Password min 8 chars.
          </div>
        )}
      </div>
    </div>
  )
}
