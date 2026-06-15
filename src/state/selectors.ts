// Derived/read-only views over AppState. Keeping these pure and centralised
// means the Bank and History screens stay thin.

import type { AppState, BreakSession, Task } from '../types'
import { isSameDay, liveElapsedSeconds } from '../utils/time'

/** Break time credited from completed tasks today (minutes). */
export function earnedTodayMins(state: AppState): number {
  return state.transactions
    .filter((t) => t.type === 'credit' && t.taskId !== null && isSameDay(t.createdAt))
    .reduce((sum, t) => sum + t.amountMins, 0)
}

/** Break minutes actually consumed today (ended sessions + active elapsed). */
export function spentTodayMins(state: AppState, now: number = Date.now()): number {
  let total = 0
  for (const b of state.breakSessions) {
    if (!isSameDay(b.startedAt, new Date(now))) continue
    if (b.id === state.activeBreakId) {
      const elapsed = Math.floor((now - new Date(b.startedAt).getTime()) / 60000)
      total += Math.max(0, Math.min(b.requestedMins, elapsed))
    } else if (b.endedAt) {
      total += b.actualMins
    } else {
      total += b.requestedMins
    }
  }
  return total
}

/** The most recent bank transaction, for the "recent transaction" line. */
export function lastTransaction(state: AppState) {
  return state.transactions[0] ?? null
}

export function activeBreak(state: AppState): BreakSession | null {
  if (!state.activeBreakId) return null
  return state.breakSessions.find((b) => b.id === state.activeBreakId) ?? null
}

/** Seconds remaining on the active break, or 0 if none. */
export function breakRemainingSeconds(
  session: BreakSession | null,
  now: number = Date.now(),
): number {
  if (!session) return 0
  const endsAt = new Date(session.startedAt).getTime() + session.requestedMins * 60000
  return Math.max(0, Math.round((endsAt - now) / 1000))
}

// ---- History / analytics selectors (used in M5) ----

export function tasksCompletedToday(state: AppState): Task[] {
  return state.tasks.filter(
    (t) =>
      (t.status === 'complete' || t.status === 'archived') &&
      t.completedAt &&
      isSameDay(t.completedAt),
  )
}

export function focusSecondsToday(state: AppState): number {
  // Sum of stopwatch time for tasks worked today. Approximation in the
  // local model: tasks whose accumulated time exists and were active today.
  return state.tasks
    .filter((t) => isSameDay(t.createdAt) || (t.completedAt && isSameDay(t.completedAt)))
    .reduce(
      (sum, t) => sum + liveElapsedSeconds(t.accumulatedSeconds, t.runningSince),
      0,
    )
}
