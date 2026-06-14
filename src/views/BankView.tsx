import { useState } from 'react'
import { useStore } from '../state/store'
import { BreakTimer } from '../components/BreakTimer'
import { formatBankMins, formatDuration } from '../utils/time'
import {
  earnedTodayMins,
  spentTodayMins,
  lastTransaction,
  activeBreak,
} from '../state/selectors'
import { requestNotificationPermission } from '../utils/notify'
import { useAuth } from '../state/auth'
import { useOnline } from '../utils/useOnline'

const QUICK = [5, 10, 25]

export function BankView() {
  const { state, dispatch } = useStore()
  const { backendConfigured, username, logout } = useAuth()
  const online = useOnline()
  // Defer bank transactions while offline to prevent cross-device desync (PRD §5.4).
  const bankLocked = backendConfigured && !online
  const onBreak = Boolean(activeBreak(state))
  const earned = earnedTodayMins(state)
  const spent = spentTodayMins(state)
  const last = lastTransaction(state)

  const [custom, setCustom] = useState('')
  const [resetArmed, setResetArmed] = useState(false)

  const startBreak = async (mins: number) => {
    if (mins <= 0 || mins > state.balanceMins || bankLocked) return
    await requestNotificationPermission()
    dispatch({ type: 'START_BREAK', requestedMins: mins })
  }

  const customMins = Math.max(0, Math.round(parseFloat(custom) || 0))

  return (
    <>
      <h1 className="view-title">Break Bank</h1>

      <div className="card bank-balance">
        <div className="bank-balance-label">Available break time</div>
        <div className="bank-balance-amount">{formatBankMins(state.balanceMins)}</div>
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
        <BreakTimer />
      ) : bankLocked ? (
        <div className="card">
          <div className="hint">
            You're offline. Starting a break is paused until you reconnect, so your
            bank balance stays in sync across devices.
          </div>
        </div>
      ) : state.balanceMins > 0 ? (
        <div className="card">
          <div className="section-label" style={{ margin: '0 0 10px' }}>
            Take a break
          </div>
          <div className="btn-row">
            {QUICK.map((m) => (
              <button
                key={m}
                className="btn"
                disabled={m > state.balanceMins}
                onClick={() => startBreak(m)}
              >
                {m} min
              </button>
            ))}
          </div>
          <div className="inline-num" style={{ marginTop: 12 }}>
            <input
              className="input"
              type="number"
              min={1}
              max={state.balanceMins}
              inputMode="numeric"
              placeholder="Custom minutes"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <button
              className="btn primary"
              style={{ flex: '0 0 110px' }}
              disabled={customMins <= 0 || customMins > state.balanceMins}
              onClick={() => {
                startBreak(customMins)
                setCustom('')
              }}
            >
              Start
            </button>
          </div>
          {customMins > state.balanceMins && (
            <div className="hint" style={{ marginTop: 6, color: 'var(--amber)' }}>
              That's more than you have banked.
            </div>
          )}
        </div>
      ) : (
        <div className="empty">
          <div className="big">Your bank is empty</div>
          <div>Complete a task to earn break time.</div>
        </div>
      )}

      {/* Settings — manual reset (PRD §4.2.3) */}
      <div className="section-label">Settings</div>
      <div className="card">
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
