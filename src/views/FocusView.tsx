import { useState } from 'react'
import { useStore, useTick } from '../state/store'
import { useView } from '../state/view'
import { formatHMS, liveElapsedSeconds } from '../utils/time'
import { CompleteDialog } from '../components/CompleteDialog'

/**
 * Task focus mode: a large numerical stopwatch with the task title and a
 * grounding verse. Auto-active while a task is being worked, but the user can
 * toggle back to Home from the nav without stopping the timer.
 */
export function FocusView() {
  const { state, dispatch } = useStore()
  const { focusTaskId, setView } = useView()
  useTick() // re-render every second so the stopwatch ticks
  const [confirming, setConfirming] = useState(false)

  const task = state.tasks.find((t) => t.id === focusTaskId)

  if (!task) {
    return (
      <div className="focus-view">
        <div className="focus-empty">No task in focus right now.</div>
        <button className="btn ghost" onClick={() => setView('home')}>
          ← Back to tasks
        </button>
      </div>
    )
  }

  const running = Boolean(task.runningSince)
  const elapsed = liveElapsedSeconds(task.accumulatedSeconds, task.runningSince)

  return (
    <div className="focus-view">
      <div className="focus-label">In focus</div>
      <h1 className="focus-task-title">{task.title}</h1>
      <div className={`focus-clock ${running ? 'running' : ''}`}>{formatHMS(elapsed)}</div>

      <div className="btn-row focus-controls">
        {running ? (
          <button
            className="btn"
            onClick={() => dispatch({ type: 'PAUSE_STOPWATCH', id: task.id })}
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={() => dispatch({ type: 'START_STOPWATCH', id: task.id })}
          >
            ▶ Resume
          </button>
        )}
        <button className="btn" onClick={() => setConfirming(true)}>
          ✓ Complete
        </button>
      </div>

      <blockquote className="verse">
        “He has made everything beautiful in its time. Also, he has put eternity into
        man's heart, yet so that he cannot find out what God has done from the
        beginning to the end.”
        <cite>Ecclesiastes 3:11</cite>
      </blockquote>

      <button className="btn ghost focus-exit" onClick={() => setView('home')}>
        ← Back to tasks
      </button>

      {confirming && (
        <CompleteDialog
          task={task}
          onClose={() => setConfirming(false)}
          onConfirm={(finalBountyMins) => {
            dispatch({ type: 'COMPLETE_TASK', id: task.id, finalBountyMins })
            setConfirming(false)
          }}
        />
      )}
    </div>
  )
}
