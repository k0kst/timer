// Analytics helpers for the History view (PRD §4.4). All pure functions over
// AppState; charts and the log are thin renderers on top of these.

import type { AppState, Task } from '../types'

export interface CompletedRow {
  id: string
  title: string
  completedAt: string
  estimatedMins: number
  actualMins: number
  bountyMins: number
  /** Signed % deviation of actual vs estimate; null when no estimate. */
  deviationPct: number | null
}

/** All completed/archived tasks as analytics rows (newest first). */
export function completedRows(state: AppState): CompletedRow[] {
  return state.tasks
    .filter((t) => (t.status === 'complete' || t.status === 'archived') && t.completedAt)
    .map((t) => {
      const actualMins = Math.round(t.accumulatedSeconds / 60)
      const deviationPct =
        t.estimatedMins > 0
          ? Math.round(((actualMins - t.estimatedMins) / t.estimatedMins) * 100)
          : null
      return {
        id: t.id,
        title: t.title,
        completedAt: t.completedAt as string,
        estimatedMins: t.estimatedMins,
        actualMins,
        bountyMins: t.bountyMins,
        deviationPct,
      }
    })
    .sort((a, b) => +new Date(b.completedAt) - +new Date(a.completedAt))
}

export interface TaskGroup {
  key: string
  title: string
  count: number
  totalActualMins: number
  totalBountyMins: number
  avgActualMins: number
  /** Mean absolute % deviation across the group's instances, or null. */
  avgDeviationPct: number | null
  lastCompletedAt: string
  rows: CompletedRow[]
}

/**
 * Group completed tasks that share a title into one repeating task, so the same
 * recurring work can be analysed across all its past instances (PRD §4.4.2).
 */
export function taskGroups(state: AppState): TaskGroup[] {
  const groups = new Map<string, CompletedRow[]>()
  for (const r of completedRows(state)) {
    const key = r.title.trim().toLowerCase()
    const arr = groups.get(key)
    if (arr) arr.push(r)
    else groups.set(key, [r])
  }
  const out: TaskGroup[] = []
  for (const rows of groups.values()) {
    const count = rows.length
    const totalActualMins = rows.reduce((s, r) => s + r.actualMins, 0)
    const totalBountyMins = rows.reduce((s, r) => s + r.bountyMins, 0)
    const devs = rows
      .filter((r) => r.deviationPct !== null)
      .map((r) => Math.abs(r.deviationPct as number))
    out.push({
      key: rows[0].title.trim().toLowerCase(),
      title: rows[0].title,
      count,
      totalActualMins,
      totalBountyMins,
      avgActualMins: Math.round(totalActualMins / count),
      avgDeviationPct: devs.length
        ? Math.round(devs.reduce((a, b) => a + b, 0) / devs.length)
        : null,
      lastCompletedAt: rows.reduce(
        (m, r) => (r.completedAt > m ? r.completedAt : m),
        rows[0].completedAt,
      ),
      rows,
    })
  }
  out.sort((a, b) => +new Date(b.lastCompletedAt) - +new Date(a.lastCompletedAt))
  return out
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export interface DayBucket {
  key: string
  label: string // e.g. "Mon"
  date: Date
}

/** The last `n` days (oldest → newest), each as a labelled bucket. */
export function lastNDays(n: number, ref: Date = new Date()): DayBucket[] {
  const out: DayBucket[] = []
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    out.push({ key: dayKey(d), label: labels[d.getDay()], date: d })
  }
  return out
}

/** Focus hours per day (from completed tasks, bucketed by completion day). */
export function focusHoursPerDay(state: AppState, days: DayBucket[]): number[] {
  const map = new Map(days.map((d) => [d.key, 0]))
  for (const t of state.tasks) {
    if (!t.completedAt) continue
    const key = dayKey(new Date(t.completedAt))
    if (map.has(key)) map.set(key, (map.get(key) || 0) + t.accumulatedSeconds / 3600)
  }
  return days.map((d) => Math.round((map.get(d.key) || 0) * 100) / 100)
}

/** Break minutes earned and spent per day. */
export function bankFlowPerDay(
  state: AppState,
  days: DayBucket[],
): { earned: number[]; spent: number[] } {
  const earned = new Map(days.map((d) => [d.key, 0]))
  const spent = new Map(days.map((d) => [d.key, 0]))
  for (const tx of state.transactions) {
    if (tx.type === 'credit' && tx.taskId) {
      const key = dayKey(new Date(tx.createdAt))
      if (earned.has(key)) earned.set(key, (earned.get(key) || 0) + tx.amountMins)
    }
  }
  for (const b of state.breakSessions) {
    const key = dayKey(new Date(b.startedAt))
    const mins = b.endedAt ? b.actualMins : b.requestedMins
    if (spent.has(key)) spent.set(key, (spent.get(key) || 0) + mins)
  }
  return {
    earned: days.map((d) => earned.get(d.key) || 0),
    spent: days.map((d) => spent.get(d.key) || 0),
  }
}

export interface DailySummary {
  tasksCompleted: number
  focusSeconds: number
  earnedMins: number
  spentMins: number
  /** Mean absolute % deviation of actual vs estimate across today's tasks. */
  estimateAccuracyPct: number | null
}

export function todaySummary(state: AppState, ref: Date = new Date()): DailySummary {
  const todayKey = dayKey(ref)
  const today = completedRows(state).filter(
    (r) => dayKey(new Date(r.completedAt)) === todayKey,
  )
  const focusSeconds = today.reduce((s, r) => s + r.actualMins * 60, 0)
  const earnedMins = today.reduce((s, r) => s + r.bountyMins, 0)
  const spent = state.breakSessions
    .filter((b) => dayKey(new Date(b.startedAt)) === todayKey)
    .reduce((s, b) => s + (b.endedAt ? b.actualMins : b.requestedMins), 0)
  const devs = today.filter((r) => r.deviationPct !== null).map((r) => Math.abs(r.deviationPct as number))
  const estimateAccuracyPct =
    devs.length > 0 ? Math.round(devs.reduce((a, b) => a + b, 0) / devs.length) : null
  return {
    tasksCompleted: today.length,
    focusSeconds,
    earnedMins,
    spentMins: spent,
    estimateAccuracyPct,
  }
}

/** Scatter points (estimated vs actual minutes) for completed tasks. */
export function accuracyPoints(state: AppState): { x: number; y: number; title: string }[] {
  return completedRows(state)
    .filter((r) => r.estimatedMins > 0)
    .map((r) => ({ x: r.estimatedMins, y: r.actualMins, title: r.title }))
}

/** Build a CSV string from completed rows (PRD §4.4.2 export). */
export function rowsToCsv(rows: CompletedRow[]): string {
  const header = ['Date', 'Title', 'Estimated (min)', 'Actual (min)', 'Bounty (min)', 'Deviation (%)']
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [
      new Date(r.completedAt).toISOString(),
      esc(r.title),
      r.estimatedMins,
      r.actualMins,
      r.bountyMins,
      r.deviationPct ?? '',
    ].join(','),
  )
  return [header.join(','), ...lines].join('\n')
}

export type { Task }
