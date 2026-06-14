import { useStore, useTick } from '../state/store'
import { formatHMS, formatBankMins, liveElapsedSeconds } from '../utils/time'

/** Persistent header showing the active task timer and the bank balance (PRD §6.1). */
export function MiniBar() {
  const { state } = useStore()
  useTick()

  const active = state.tasks.find((t) => t.runningSince)
  const elapsed = active
    ? liveElapsedSeconds(active.accumulatedSeconds, active.runningSince)
    : 0

  return (
    <header className="minibar">
      <div className="brand">
        Bounty<span>Timer</span>
      </div>
      <div className="active-task">
        {active ? (
          <>
            <strong>{active.title}</strong> · <span className="timer">{formatHMS(elapsed)}</span>
          </>
        ) : (
          <span style={{ color: 'var(--ink-faint)' }}>No active focus session</span>
        )}
      </div>
      <div className="bank-chip" title="Break Bank balance">
        🏦 {formatBankMins(state.balanceMins)}
      </div>
    </header>
  )
}
