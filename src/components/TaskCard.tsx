import { useState } from 'react'
import type { Task } from '../types'
import { useStore, useTick } from '../state/store'
import { formatHMS, formatDuration, liveElapsedSeconds } from '../utils/time'
import { AddTaskForm } from './AddTaskForm'
import { CompleteDialog } from './CompleteDialog'

const priorityLabel: Record<Task['priority'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: '',
}

const frequencyLabel: Record<Task['frequency'], string> = {
  once: '',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export function TaskCard({ task }: { task: Task }) {
  const { dispatch } = useStore()
  useTick() // re-render every second so the live timer ticks
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const running = Boolean(task.runningSince)
  const isComplete = task.status === 'complete'
  const elapsed = liveElapsedSeconds(task.accumulatedSeconds, task.runningSince)

  return (
    <div className={`card task-card ${running ? 'running' : ''} ${isComplete ? 'complete' : ''}`}>
      <div className="task-top">
        <div
          className={`task-title ${isComplete ? 'done' : ''}`}
          onClick={() => setExpanded((v) => !v)}
        >
          {task.title}
        </div>
        <div className={`elapsed ${running ? 'running' : ''}`}>{formatHMS(elapsed)}</div>
      </div>

      <div className="task-meta">
        <span className="pill bounty">🎁 {formatDuration(task.bountyMins)} bounty</span>
        <span className="pill">est {formatDuration(task.estimatedMins)}</span>
        {task.priority !== 'none' && (
          <span className={`pill priority-${task.priority}`}>{priorityLabel[task.priority]}</span>
        )}
        {task.frequency !== 'once' && (
          <span className="pill">🔁 {frequencyLabel[task.frequency]}</span>
        )}
        {isComplete && <span className="pill" style={{ color: 'var(--green)' }}>✓ done</span>}
      </div>

      {expanded && task.notes && (
        <p style={{ color: 'var(--ink-dim)', fontSize: 14, marginTop: 10, whiteSpace: 'pre-wrap' }}>
          {task.notes}
        </p>
      )}

      <div className="task-controls">
        {!isComplete && !running && (
          <button
            className="btn primary small"
            onClick={() => dispatch({ type: 'START_STOPWATCH', id: task.id })}
          >
            ▶ {task.accumulatedSeconds > 0 ? 'Resume' : 'Start'}
          </button>
        )}
        {!isComplete && running && (
          <button
            className="btn small"
            onClick={() => dispatch({ type: 'PAUSE_STOPWATCH', id: task.id })}
          >
            ⏸ Pause
          </button>
        )}
        {!isComplete && (
          <button className="btn small" onClick={() => setConfirming(true)}>
            ✓ Complete
          </button>
        )}
        {isComplete && (
          <button
            className="btn ghost small"
            onClick={() => dispatch({ type: 'REOPEN_TASK', id: task.id })}
          >
            ↺ Re-open
          </button>
        )}

        <div className="spacer" />

        {!isComplete && (
          <button className="btn ghost small" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
        <button
          className="btn ghost small danger"
          onClick={() => {
            if (confirm(`Delete "${task.title}"?`)) dispatch({ type: 'DELETE_TASK', id: task.id })
          }}
        >
          Delete
        </button>
      </div>

      {editing && (
        <AddTaskForm
          initial={task}
          onClose={() => setEditing(false)}
          onSubmit={(patch) => dispatch({ type: 'UPDATE_TASK', id: task.id, patch })}
        />
      )}

      {confirming && (
        <CompleteDialog
          task={task}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            dispatch({ type: 'COMPLETE_TASK', id: task.id })
            setConfirming(false)
          }}
        />
      )}
    </div>
  )
}
