import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { TaskCard } from '../components/TaskCard'
import { AddTaskForm } from '../components/AddTaskForm'
import type { Task } from '../types'

type Filter = 'all' | 'active' | 'completed'
type Sort = 'manual' | 'priority' | 'bounty' | 'date'

const priorityRank: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
}

export function TasksView() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('manual')
  const [adding, setAdding] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  const visible = useMemo(() => {
    // The Completed tab mirrors History: it shows finished work, including
    // older tasks that have rolled off into the archive. The other tabs keep
    // archived tasks out of the active list.
    let list: Task[]
    if (filter === 'completed') {
      list = state.tasks.filter((t) => t.status === 'complete' || t.status === 'archived')
    } else {
      list = state.tasks.filter((t) => t.status !== 'archived')
      if (filter === 'active') list = list.filter((t) => t.status !== 'complete')
    }

    const sorted = [...list]
    if (sort === 'priority') sorted.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    else if (sort === 'bounty') sorted.sort((a, b) => b.bountyMins - a.bountyMins)
    else if (sort === 'date') sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    else if (filter === 'completed')
      sorted.sort((a, b) => +new Date(b.completedAt ?? 0) - +new Date(a.completedAt ?? 0))
    return sorted
  }, [state.tasks, filter, sort])

  // Drag-and-drop reorder, only meaningful in manual order (PRD §4.1.5).
  const canDrag = sort === 'manual'
  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return setDragId(null)
    const ids = visible.map((t) => t.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return setDragId(null)
    ids.splice(to, 0, ids.splice(from, 1)[0])
    dispatch({ type: 'REORDER_TASKS', order: ids })
    setDragId(null)
  }

  return (
    <>
      <h1 className="view-title">Tasks</h1>

      <div className="toolbar">
        <div className="seg">
          {(['all', 'active', 'completed'] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <select className="select" style={{ maxWidth: 150 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="manual">Manual order</option>
          <option value="priority">Priority</option>
          <option value="bounty">Bounty size</option>
          <option value="date">Date added</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <div className="big">No tasks here yet</div>
          <div>Tap + to add your first task and set its bounty.</div>
        </div>
      ) : (
        visible.map((task) => (
          <div
            key={task.id}
            draggable={canDrag}
            onDragStart={() => setDragId(task.id)}
            onDragOver={(e) => canDrag && e.preventDefault()}
            onDrop={() => onDrop(task.id)}
            className={dragId === task.id ? 'dragging' : ''}
          >
            <TaskCard task={task} />
          </div>
        ))
      )}

      <button className="quick-add" aria-label="Add task" onClick={() => setAdding(true)}>
        +
      </button>

      {adding && (
        <AddTaskForm
          onClose={() => setAdding(false)}
          onSubmit={(input) => dispatch({ type: 'ADD_TASK', input })}
        />
      )}
    </>
  )
}
