import { useEffect, useRef, useState } from 'react'
import { useStore, useTick } from '../state/store'
import { useView } from '../state/view'
import { activeBreak, breakRemainingSeconds } from '../state/selectors'
import { formatHMS, formatBankMins } from '../utils/time'
import { notify, requestNotificationPermission } from '../utils/notify'
import { useAuth } from '../state/auth'
import { useOnline } from '../utils/useOnline'

/**
 * Break mode: a full, numerical countdown of the rest time being spent from the
 * Break Bank. No preset durations — the user types the minutes they want.
 */
export function BreakView() {
  const { state, dispatch } = useStore()
  const { setView } = useView()
  const { backendConfigured } = useAuth()
  const online = useOnline()
  const now = useTick()
  const firedRef = useRef(false)

  const bankLocked = backendConfigured && !online
  const session = activeBreak(state)
  const remaining = breakRemainingSeconds(session, now)

  const [minutes, setMinutes] = useState('')
  const [extra, setExtra] = useState('')

  // Auto-end when the countdown hits zero (PRD §4.2.2).
  useEffect(() => {
    if (!session) {
      firedRef.current = false
      return
    }
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      const shown = notify('Break over', 'Time to get back to it. ✨')
      if (!shown) setTimeout(() => alert('Break over — time to get back to it.'), 0)
      dispatch({ type: 'END_BREAK', actualMins: session.requestedMins })
    }
  }, [remaining, session, dispatch])

  const startMins = Math.max(0, Math.round(parseFloat(minutes) || 0))
  const extraMins = Math.max(0, Math.round(parseFloat(extra) || 0))

  const start = async () => {
    if (startMins <= 0 || startMins > state.balanceMins || bankLocked) return
    await requestNotificationPermission()
    dispatch({ type: 'START_BREAK', requestedMins: startMins })
    setMinutes('')
  }

  // ---- Active break: full countdown ----
  if (session) {
    const minsSoFar = Math.round((session.requestedMins * 60 - remaining) / 60)
    return (
      <div className="break-view">
        <div className="focus-label">Break in progress</div>
        <div className="break-clock">{formatHMS(remaining)}</div>
        <div className="clock-sub">remaining</div>

        <div className="inline-num break-extend">
          <input
            className="input"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Add minutes"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
          <button
            className="btn"
            style={{ flex: '0 0 110px' }}
            disabled={extraMins <= 0 || extraMins > state.balanceMins}
            onClick={() => {
              dispatch({ type: 'EXTEND_BREAK', extraMins })
              setExtra('')
            }}
          >
            + Extend
          </button>
        </div>

        <button
          className="btn primary break-end"
          onClick={() => dispatch({ type: 'END_BREAK', actualMins: minsSoFar })}
        >
          End break{minsSoFar < session.requestedMins ? ' (return unused)' : ''}
        </button>

        <button className="btn ghost focus-exit" onClick={() => setView('home')}>
          ← Back to home
        </button>
      </div>
    )
  }

  // ---- No active break: type the minutes to spend ----
  return (
    <div className="break-view">
      <div className="focus-label">Take a break</div>
      <div className="break-balance">{formatBankMins(state.balanceMins)} banked</div>

      {bankLocked ? (
        <div className="hint" style={{ maxWidth: 320, textAlign: 'center' }}>
          You're offline. Starting a break is paused until you reconnect, so your bank
          stays in sync across devices.
        </div>
      ) : state.balanceMins > 0 ? (
        <>
          <div className="inline-num" style={{ maxWidth: 320 }}>
            <input
              className="input"
              type="number"
              min={1}
              max={state.balanceMins}
              inputMode="numeric"
              placeholder="Minutes"
              value={minutes}
              autoFocus
              onChange={(e) => setMinutes(e.target.value)}
            />
            <button
              className="btn primary"
              style={{ flex: '0 0 110px' }}
              disabled={startMins <= 0 || startMins > state.balanceMins}
              onClick={start}
            >
              Start
            </button>
          </div>
          {startMins > state.balanceMins && (
            <div className="hint" style={{ marginTop: 6, color: 'var(--amber)' }}>
              That's more than you have banked.
            </div>
          )}
        </>
      ) : (
        <div className="hint">Your bank is empty — complete a task to earn break time.</div>
      )}

      <button className="btn ghost focus-exit" onClick={() => setView('home')}>
        ← Back to home
      </button>
    </div>
  )
}
