import { useEffect, useRef } from 'react'
import { useStore, useTick } from '../state/store'
import { activeBreak, breakRemainingSeconds } from '../state/selectors'
import { formatHMS } from '../utils/time'
import { notify } from '../utils/notify'

const EXTEND_STEP = 5

/** Large clock-face countdown for an active break (PRD §4.2.2, §6.2). */
export function BreakTimer() {
  const { state, dispatch } = useStore()
  const now = useTick()
  const session = activeBreak(state)
  const firedRef = useRef(false)

  const remaining = breakRemainingSeconds(session, now)
  const total = session ? session.requestedMins * 60 : 0
  const progress = total > 0 ? 1 - remaining / total : 0

  // Auto-end when the countdown reaches zero (PRD §4.2.2).
  useEffect(() => {
    if (!session) {
      firedRef.current = false
      return
    }
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      const shown = notify('Break over', 'Time to get back to it. ✨')
      if (!shown) {
        // On-screen fallback when notifications aren't permitted.
        setTimeout(() => alert('Break over — time to get back to it.'), 0)
      }
      dispatch({ type: 'END_BREAK', actualMins: session.requestedMins })
    }
  }, [remaining, session, dispatch])

  if (!session) return null

  const circumference = 2 * Math.PI * 52
  const minsSoFar = Math.round((total - remaining) / 60)

  return (
    <div className="break-timer card">
      <div className="clock-face">
        <svg viewBox="0 0 120 120" width="200" height="200">
          <circle cx="60" cy="60" r="52" className="clock-track" />
          <circle
            cx="60"
            cy="60"
            r="52"
            className="clock-progress"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="clock-label">
          <div className="clock-time">{formatHMS(remaining)}</div>
          <div className="clock-sub">remaining</div>
        </div>
      </div>

      <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>
        <button
          className="btn"
          onClick={() => dispatch({ type: 'EXTEND_BREAK', extraMins: EXTEND_STEP })}
          disabled={state.balanceMins < EXTEND_STEP}
          title={state.balanceMins < EXTEND_STEP ? 'Not enough banked time' : undefined}
        >
          +{EXTEND_STEP} min
        </button>
        <button
          className="btn primary"
          onClick={() => dispatch({ type: 'END_BREAK', actualMins: minsSoFar })}
        >
          End break{minsSoFar < session.requestedMins ? ' (return unused)' : ''}
        </button>
      </div>
    </div>
  )
}
