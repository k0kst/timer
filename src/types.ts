// Core domain types for BountyTimer.
// These mirror the PRD §8 data model so a backend (Supabase) can adopt
// the same shapes later without reshaping the client.

export type Priority = 'high' | 'medium' | 'low' | 'none'

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'complete'
  | 'archived'

export interface Task {
  id: string
  title: string
  estimatedMins: number
  bountyMins: number
  priority: Priority
  notes: string
  status: TaskStatus
  createdAt: string // ISO timestamp
  completedAt: string | null

  // Stopwatch bookkeeping.
  // accumulatedSeconds: focus time banked from previous runs.
  // runningSince: ISO timestamp of the current run start, or null when not running.
  // The live elapsed time = accumulatedSeconds + (now - runningSince).
  accumulatedSeconds: number
  runningSince: string | null

  // True once the bounty has been credited (so re-opening never double-credits).
  bountyCredited: boolean
}

export type BankTransactionType = 'credit' | 'debit' | 'reset'

export interface BankTransaction {
  id: string
  type: BankTransactionType
  amountMins: number // positive for credit, negative for debit, 0 for reset
  taskId: string | null
  note: string
  createdAt: string
}

export interface BreakSession {
  id: string
  requestedMins: number
  actualMins: number
  startedAt: string
  endedAt: string | null
}

export interface AppState {
  tasks: Task[]
  transactions: BankTransaction[]
  breakSessions: BreakSession[]
  balanceMins: number // cached balance, derived from transactions
  // The id of an in-progress break, if any (M2). Null when no break is active.
  activeBreakId: string | null
}

export const MAX_SESSION_SECONDS = 8 * 60 * 60 // 8 hours (PRD §4.3)
export const TITLE_MAX = 120
