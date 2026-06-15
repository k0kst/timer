import { useState } from 'react'
import type { Task } from '../types'
import { useStore } from '../state/store'
import { Modal } from './Modal'
import { formatDuration } from '../utils/time'

interface Props {
  task: Task
  /** Receives the final bounty (in minutes) the user confirmed. */
  onConfirm: (finalBountyMins: number) => void
  onClose: () => void
}

/**
 * Completion confirmation (PRD §4.1.4): the user confirms — and can adjust —
 * the final bounty before it lands in the Break Bank.
 */
export function CompleteDialog({ task, onConfirm, onClose }: Props) {
  const { state } = useStore()
  const alreadyCredited = task.bountyCredited
  const [bounty, setBounty] = useState(String(task.bountyMins))

  const finalMins = Math.max(0, Math.round(parseFloat(bounty) || 0))
  const willCredit = alreadyCredited ? 0 : finalMins
  const projected = state.balanceMins + willCredit

  return (
    <Modal onClose={onClose}>
      <h3>Complete task</h3>
      <div className="confirm-line">
        <div style={{ marginBottom: 8 }}>{task.title}</div>
        {alreadyCredited ? (
          <div className="hint">
            Bounty already credited earlier — completing again won't add more break time.
          </div>
        ) : (
          <>
            <label className="hint" htmlFor="final-bounty">
              Final bounty to add to your Break Bank
            </label>
            <div className="inline-num" style={{ marginTop: 6 }}>
              <input
                id="final-bounty"
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                value={bounty}
                autoFocus
                onChange={(e) => setBounty(e.target.value)}
              />
              <span
                className="select"
                style={{
                  flex: '0 0 110px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                minutes
              </span>
            </div>
            <div className="hint" style={{ marginTop: 8 }}>
              Adds <span style={{ color: 'var(--teal)' }}>+{formatDuration(willCredit)}</span> —
              new Break Bank total: {formatDuration(projected)}
            </div>
          </>
        )}
      </div>
      <div className="btn-row">
        <button className="btn primary" style={{ flex: 1 }} onClick={() => onConfirm(finalMins)}>
          Confirm
        </button>
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
