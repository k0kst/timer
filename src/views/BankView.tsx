import { useState } from 'react'
import { useStore } from '../state/store'
import { useView } from '../state/view'
import { formatBankMins, formatDuration } from '../utils/time'
import {
  earnedTodayMins,
  spentTodayMins,
  lastTransaction,
  activeBreak,
} from '../state/selectors'
import { useAuth } from '../state/auth'
import { AnimatedNumber } from '../components/AnimatedNumber'

export function BankView() {
  const { state, dispatch, devMode, setDevMode } = useStore()
  const { setView } = useView()
  const { backendConfigured, username, logout } = useAuth()
  const onBreak = Boolean(activeBreak(state))
  const earned = earnedTodayMins(state)
  const spent = spentTodayMins(state)
  const last = lastTransaction(state)

  const [resetArmed, setResetArmed] = useState(false)

  return (
    <>
      <h1 className="view-title">Break Bank</h1>

      <div className="card bank-balance">
        <div className="bank-balance-label">Available break time</div>
        <div className="bank-balance-amount">
          <AnimatedNumber value={state.balanceMins} format={formatBankMins} />
        </div>
        {last && (
          <div className="bank-recent">
            {last.type === 'credit' && `+${formatDuration(last.amountMins)} — ${last.note}`}
            {last.type === 'debit' && `${formatDuration(last.amountMins)} min — ${last.note}`}
            {last.type === 'reset' && last.note}
          </div>
        )}
        <div className="bank-today">
          <div>
            <span className="up">▲ {formatDuration(earned)}</span>
            <div className="hint">earned today</div>
          </div>
          <div>
            <span className="down">▼ {formatDuration(spent)}</span>
            <div className="hint">spent today</div>
          </div>
        </div>
      </div>

      {onBreak ? (
        <div className="card">
          <div className="section-label" style={{ margin: '0 0 10px' }}>
            Break in progress
          </div>
          <button className="btn primary" style={{ width: '100%' }} onClick={() => setView('break')}>
            ⏱ Open break timer
          </button>
        </div>
      ) : state.balanceMins > 0 ? (
        <div className="card">
          <div className="section-label" style={{ margin: '0 0 10px' }}>
            Take a break
          </div>
          <button className="btn primary" style={{ width: '100%' }} onClick={() => setView('break')}>
            ☕ Start a break
          </button>
          <div className="hint" style={{ marginTop: 8 }}>
            Enter how many minutes to spend — it counts down full-screen.
          </div>
        </div>
      ) : (
        <div className="empty">
          <div className="big">Your bank is empty</div>
          <div>Complete a task to earn break time.</div>
        </div>
      )}

      {/* Settings — daily + manual reset (PRD §4.2.3) */}
      <div className="section-label">Settings</div>
      <div className="card">
        <div className="hint" style={{ marginBottom: 12 }}>
          🔄 Your bank refills to 1h of rest time automatically at the start of each
          day.
        </div>
        {!resetArmed ? (
          <button className="btn ghost danger" onClick={() => setResetArmed(true)}>
            Reset Break Bank to 0
          </button>
        ) : (
          <div>
            <div className="hint" style={{ marginBottom: 10 }}>
              This sets your balance to 0 (logged in history). Your full transaction
              history is kept.
            </div>
            <div className="btn-row">
              <button
                className="btn danger"
                onClick={() => {
                  dispatch({ type: 'RESET_BANK' })
                  setResetArmed(false)
                }}
              >
                Yes, reset to 0
              </button>
              <button className="btn ghost" onClick={() => setResetArmed(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Testing mode — sandbox that never touches the real account */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>🧪 Testing mode</div>
          <div className="hint">
            Try features in a sandbox. Your real tasks and bank stay untouched.
          </div>
        </div>
        <button
          className={devMode ? 'btn primary small' : 'btn small'}
          onClick={() => setDevMode(!devMode)}
        >
          {devMode ? 'Exit' : 'Enter'}
        </button>
      </div>

      {backendConfigured && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Signed in as {username}</div>
            <div className="hint">Synced across your devices.</div>
          </div>
          <button className="btn ghost small" onClick={logout}>
            Sign out
          </button>
        </div>
      )}
    </>
  )
}
