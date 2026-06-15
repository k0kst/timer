import { useState } from 'react'
import { Modal } from './Modal'
import { TITLE_MAX, type Frequency, type Priority, type Task } from '../types'
import type { NewTaskInput } from '../state/reducer'

interface AddTaskFormProps {
  initial?: Task
  onSubmit: (input: NewTaskInput) => void
  onClose: () => void
}

type Unit = 'min' | 'hr'

function splitMins(mins: number): { value: number; unit: Unit } {
  if (mins >= 60 && mins % 60 === 0) return { value: mins / 60, unit: 'hr' }
  return { value: mins, unit: 'min' }
}

/** Add / edit a task (PRD §4.1.1). Bounty defaults to the estimate, overridable. */
export function AddTaskForm({ initial, onSubmit, onClose }: AddTaskFormProps) {
  const est = initial ? splitMins(initial.estimatedMins) : { value: 25, unit: 'min' as Unit }
  const [title, setTitle] = useState(initial?.title ?? '')
  const [estValue, setEstValue] = useState(String(est.value))
  const [estUnit, setEstUnit] = useState<Unit>(est.unit)
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'none')
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? 'once')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [showNotes, setShowNotes] = useState(Boolean(initial?.notes))

  // Bounty override: when off, bounty tracks the estimate.
  const initialOverride =
    initial != null && initial.bountyMins !== initial.estimatedMins
  const [override, setOverride] = useState(initialOverride)
  const bountyInit = initial ? splitMins(initial.bountyMins) : est
  const [bountyValue, setBountyValue] = useState(String(bountyInit.value))
  const [bountyUnit, setBountyUnit] = useState<Unit>(bountyInit.unit)

  const toMins = (value: string, unit: Unit) => {
    const n = parseFloat(value)
    if (Number.isNaN(n) || n < 0) return 0
    return Math.round(unit === 'hr' ? n * 60 : n)
  }

  const estimatedMins = toMins(estValue, estUnit)
  const bountyMins = override ? toMins(bountyValue, bountyUnit) : estimatedMins
  const canSubmit = title.trim().length > 0 && estimatedMins > 0

  const submit = () => {
    if (!canSubmit) return
    onSubmit({ title, estimatedMins, bountyMins, priority, frequency, notes: showNotes ? notes : '' })
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h3>{initial ? 'Edit task' : 'New task'}</h3>

      <div className="field">
        <label htmlFor="t-title">Title</label>
        <input
          id="t-title"
          className="input"
          value={title}
          maxLength={TITLE_MAX}
          placeholder="What are you working on?"
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) submit()
          }}
        />
        <div className="char-count">
          {title.length}/{TITLE_MAX}
        </div>
      </div>

      <div className="field">
        <label>Estimated time</label>
        <div className="inline-num">
          <input
            className="input"
            type="number"
            min={0}
            inputMode="numeric"
            value={estValue}
            onChange={(e) => setEstValue(e.target.value)}
          />
          <select
            className="select"
            value={estUnit}
            onChange={(e) => setEstUnit(e.target.value as Unit)}
          >
            <option value="min">minutes</option>
            <option value="hr">hours</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => setOverride(e.target.checked)}
          />
          Set a different bounty
        </label>
        {override ? (
          <div className="inline-num">
            <input
              className="input"
              type="number"
              min={0}
              inputMode="numeric"
              value={bountyValue}
              onChange={(e) => setBountyValue(e.target.value)}
            />
            <select
              className="select"
              value={bountyUnit}
              onChange={(e) => setBountyUnit(e.target.value as Unit)}
            >
              <option value="min">minutes</option>
              <option value="hr">hours</option>
            </select>
          </div>
        ) : (
          <div className="hint">Bounty = estimate ({estimatedMins} min of earned break)</div>
        )}
      </div>

      <div className="field">
        <label htmlFor="t-prio">Priority</label>
        <select
          id="t-prio"
          className="select"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="none">None</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="t-freq">Frequency</label>
        <select
          id="t-freq"
          className="select"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
        >
          <option value="once">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        {frequency !== 'once' && (
          <div className="hint">
            Repeats {frequency} — a fresh copy reappears each new period after you
            complete it.
          </div>
        )}
      </div>

      {showNotes ? (
        <div className="field">
          <label htmlFor="t-notes">Notes</label>
          <textarea
            id="t-notes"
            className="textarea"
            value={notes}
            placeholder="Context, links, sub-steps…"
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      ) : (
        <button className="btn ghost small" onClick={() => setShowNotes(true)}>
          + Add notes
        </button>
      )}

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn primary" style={{ flex: 1 }} disabled={!canSubmit} onClick={submit}>
          {initial ? 'Save changes' : 'Add task'}
        </button>
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
