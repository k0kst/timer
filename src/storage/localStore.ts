// localStorage-backed persistence for M1.
//
// This is intentionally behind a tiny interface so that M3 can replace it
// with a backend-backed repository without touching the rest of the app.

import type { AppState } from '../types'

const STORAGE_KEY = 'bountytimer:v1'

export const emptyState: AppState = {
  tasks: [],
  transactions: [],
  breakSessions: [],
  balanceMins: 0,
  activeBreakId: null,
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<AppState>
    // Merge with defaults so older/partial payloads stay valid.
    return {
      ...emptyState,
      ...parsed,
      tasks: parsed.tasks ?? [],
      transactions: parsed.transactions ?? [],
      breakSessions: parsed.breakSessions ?? [],
      balanceMins: parsed.balanceMins ?? 0,
      activeBreakId: parsed.activeBreakId ?? null,
    }
  } catch (err) {
    console.error('Failed to load BountyTimer state, starting fresh.', err)
    return emptyState
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to persist BountyTimer state.', err)
  }
}
