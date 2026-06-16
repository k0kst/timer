// localStorage-backed persistence for M1.
//
// This is intentionally behind a tiny interface so that M3 can replace it
// with a backend-backed repository without touching the rest of the app.

import type { AppState, Task } from '../types'

export const STORAGE_KEY = 'bountytimer:v1'
// A separate sandbox used by testing mode so experiments never touch the
// user's real tasks, bank, or history.
export const DEV_STORAGE_KEY = 'bountytimer:dev'

export const emptyState: AppState = {
  tasks: [],
  transactions: [],
  breakSessions: [],
  balanceMins: 0,
  activeBreakId: null,
  lastDailyResetAt: null,
}

/** Backfill fields added after a task was first persisted. */
function normalizeTask(t: Task): Task {
  return { ...t, frequency: t.frequency ?? 'once' }
}

export function loadState(key: string = STORAGE_KEY): AppState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<AppState>
    // Merge with defaults so older/partial payloads stay valid.
    return {
      ...emptyState,
      ...parsed,
      tasks: (parsed.tasks ?? []).map(normalizeTask),
      transactions: parsed.transactions ?? [],
      breakSessions: parsed.breakSessions ?? [],
      balanceMins: parsed.balanceMins ?? 0,
      activeBreakId: parsed.activeBreakId ?? null,
      lastDailyResetAt: parsed.lastDailyResetAt ?? null,
    }
  } catch (err) {
    console.error('Failed to load BountyTimer state, starting fresh.', err)
    return emptyState
  }
}

export function saveState(state: AppState, key: string = STORAGE_KEY): void {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to persist BountyTimer state.', err)
  }
}
