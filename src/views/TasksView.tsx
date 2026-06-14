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

  const visible = useMemo(() => {
    // Archived tasks live in History, never on the active list.
    let list = state.tasks.filter((t) => t.status !== 'archived')
    if (filter === 'active') list = list.filter((t) => t.status !== 'complete')
    if (filter === 'completed') list = list.filter((t) => t.status === 'complete')

    const sorted = [...list]
    if (sort === 'priority') sorted.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    else if (sort === 'bounty') sorted.sort((a, b) => b.bountyMins - a.bountyMins)
    else if (sort === 'date') sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return sorted
  }, [state.tasks, filter, sort])

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
        visible.map((task) => <TaskCard key={task.id} task={task} />)
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
