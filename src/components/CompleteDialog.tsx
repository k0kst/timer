import type { Task } from '../types'
import { useStore } from '../state/store'
import { Modal } from './Modal'
import { formatDuration } from '../utils/time'

interface Props {
  task: Task
  onConfirm: () => void
  onClose: () => void
}

/** Completion confirmation (PRD §4.1.4): shows bounty and projected bank total. */
export function CompleteDialog({ task, onConfirm, onClose }: Props) {
  const { state } = useStore()
  const willCredit = !task.bountyCredited ? task.bountyMins : 0
  const projected = state.balanceMins + willCredit

  return (
    <Modal onClose={onClose}>
      <h3>Complete task</h3>
      <div className="confirm-line">
        <div style={{ marginBottom: 8 }}>{task.title}</div>
        {willCredit > 0 ? (
          <>
            <div>
              Bounty: <span className="big">+{formatDuration(willCredit)}</span>
            </div>
            <div className="hint" style={{ marginTop: 6 }}>
              New Break Bank total: {formatDuration(projected)}
            </div>
          </>
        ) : (
          <div className="hint">
            Bounty already credited earlier — completing again won't add more break time.
          </div>
        )}
      </div>
      <div className="btn-row">
        <button className="btn primary" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm
        </button>
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
