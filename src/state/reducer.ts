// The single reducer that owns all BountyTimer state transitions.
// Keeping the logic pure makes the bounty/stopwatch rules easy to reason about
// and lets persistence + backend sync wrap it cleanly.

import {
  type AppState,
  type Task,
  type Priority,
  type Frequency,
  type BankTransaction,
  MAX_SESSION_SECONDS,
  DAILY_START_MINS,
} from '../types'
import { liveElapsedSeconds, uid, isSameDay } from '../utils/time'

export interface NewTaskInput {
  title: string
  estimatedMins: number
  bountyMins: number
  priority: Priority
  frequency: Frequency
  notes: string
}

export type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'ADD_TASK'; input: NewTaskInput }
  | { type: 'UPDATE_TASK'; id: string; patch: Partial<NewTaskInput> }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'REORDER_TASKS'; order: string[] }
  | { type: 'START_STOPWATCH'; id: string }
  | { type: 'PAUSE_STOPWATCH'; id: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'REOPEN_TASK'; id: string }
  | { type: 'ARCHIVE_OLD' }
  | { type: 'DAILY_RESET' }
  | { type: 'RESET_BANK' }
  | { type: 'START_BREAK'; requestedMins: number }
  | { type: 'END_BREAK'; actualMins: number }
  | { type: 'EXTEND_BREAK'; extraMins: number }

const now = () => new Date().toISOString()

/** Fold a running task's live time into accumulated seconds and stop it. */
function freezeStopwatch(task: Task): Task {
  if (!task.runningSince) return task
  const accumulated = Math.min(
    MAX_SESSION_SECONDS,
    liveElapsedSeconds(task.accumulatedSeconds, task.runningSince),
  )
  return { ...task, accumulatedSeconds: accumulated, runningSince: null }
}

/**
 * Whether a completed recurring task is due to re-arm for a new period.
 * 'once' tasks never recur (they archive on the next day instead).
 */
function recurDue(task: Task, ref: Date): boolean {
  if (task.frequency === 'once' || !task.completedAt) return false
  const completed = new Date(task.completedAt)
  switch (task.frequency) {
    case 'daily':
      return !isSameDay(task.completedAt, ref)
    case 'weekly':
      return ref.getTime() - completed.getTime() >= 7 * 24 * 60 * 60 * 1000
    case 'monthly': {
      const next = new Date(completed)
      next.setMonth(next.getMonth() + 1)
      return ref.getTime() >= next.getTime()
    }
    default:
      return false
  }
}

/** A fresh, not-started copy of a recurring task for its next occurrence. */
function freshRecurrence(task: Task): Task {
  return {
    ...task,
    id: uid(),
    status: 'not_started',
    createdAt: now(),
    completedAt: null,
    accumulatedSeconds: 0,
    runningSince: null,
    bountyCredited: false,
  }
}

function credit(
  state: AppState,
  amountMins: number,
  taskId: string | null,
  note: string,
): AppState {
  const tx: BankTransaction = {
    id: uid(),
    type: 'credit',
    amountMins,
    taskId,
    note,
    createdAt: now(),
  }
  return {
    ...state,
    transactions: [tx, ...state.transactions],
    balanceMins: state.balanceMins + amountMins,
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      // Replace local state with an authoritative snapshot (e.g. from the server).
      return action.state

    case 'ADD_TASK': {
      const task: Task = {
        id: uid(),
        title: action.input.title.trim().slice(0, 120),
        estimatedMins: Math.max(0, Math.round(action.input.estimatedMins)),
        bountyMins: Math.max(0, Math.round(action.input.bountyMins)),
        priority: action.input.priority,
        frequency: action.input.frequency,
        notes: action.input.notes,
        status: 'not_started',
        createdAt: now(),
        completedAt: null,
        accumulatedSeconds: 0,
        runningSince: null,
        bountyCredited: false,
      }
      return { ...state, tasks: [task, ...state.tasks] }
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.id) return t
          const p = action.patch
          return {
            ...t,
            ...(p.title !== undefined ? { title: p.title.slice(0, 120) } : {}),
            ...(p.estimatedMins !== undefined
              ? { estimatedMins: Math.max(0, Math.round(p.estimatedMins)) }
              : {}),
            ...(p.bountyMins !== undefined
              ? { bountyMins: Math.max(0, Math.round(p.bountyMins)) }
              : {}),
            ...(p.priority !== undefined ? { priority: p.priority } : {}),
            ...(p.frequency !== undefined ? { frequency: p.frequency } : {}),
            ...(p.notes !== undefined ? { notes: p.notes } : {}),
          }
        }),
      }
    }

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }

    case 'REORDER_TASKS': {
      const byId = new Map(state.tasks.map((t) => [t.id, t]))
      const reordered = action.order
        .map((id) => byId.get(id))
        .filter((t): t is Task => Boolean(t))
      // Append any tasks not present in the order list (safety).
      const seen = new Set(action.order)
      const rest = state.tasks.filter((t) => !seen.has(t.id))
      return { ...state, tasks: [...reordered, ...rest] }
    }

    case 'START_STOPWATCH': {
      // Only one stopwatch may run at a time: freeze every other running task.
      const tasks = state.tasks.map((t) => {
        if (t.id === action.id) {
          if (t.runningSince) return t // already running
          return { ...t, status: 'in_progress' as const, runningSince: now() }
        }
        if (t.runningSince) {
          return { ...freezeStopwatch(t), status: 'paused' as const }
        }
        return t
      })
      return { ...state, tasks }
    }

    case 'PAUSE_STOPWATCH': {
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.id || !t.runningSince) return t
          return { ...freezeStopwatch(t), status: 'paused' as const }
        }),
      }
    }

    case 'COMPLETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.id)
      if (!task) return state
      const frozen = freezeStopwatch(task)
      const completed: Task = {
        ...frozen,
        status: 'complete',
        completedAt: now(),
        bountyCredited: true,
      }
      let next: AppState = {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? completed : t)),
      }
      // Credit the bounty only on the first completion (PRD §4.1.3).
      if (!task.bountyCredited && completed.bountyMins > 0) {
        next = credit(next, completed.bountyMins, completed.id, completed.title)
      }
      return next
    }

    case 'REOPEN_TASK': {
      // Re-open a completed task and resume its stopwatch. Bounty is NOT re-credited.
      const tasks = state.tasks.map((t) => {
        if (t.id === action.id) {
          return {
            ...t,
            status: 'in_progress' as const,
            completedAt: null,
            runningSince: now(),
          }
        }
        // Honour the single-running-stopwatch rule.
        if (t.runningSince) return { ...freezeStopwatch(t), status: 'paused' as const }
        return t
      })
      return { ...state, tasks }
    }

    case 'ARCHIVE_OLD': {
      const today = new Date()
      const out: Task[] = []
      for (const t of state.tasks) {
        const isStale =
          t.status === 'complete' &&
          t.completedAt != null &&
          !isSameDay(t.completedAt, today)
        if (isStale && recurDue(t, today)) {
          // Recurring task: keep the completed instance in History (archived)
          // and re-arm a fresh occurrence for the new period.
          out.push({ ...t, status: 'archived' })
          out.push(freshRecurrence(t))
        } else if (isStale && t.frequency === 'once') {
          out.push({ ...t, status: 'archived' })
        } else {
          out.push(t)
        }
      }
      return { ...state, tasks: out }
    }

    case 'DAILY_RESET': {
      // Once per calendar day, top the bank up to its starting balance so the
      // user begins each day with a fixed allowance of rest time (PRD §4.2.3).
      if (state.lastDailyResetAt && isSameDay(state.lastDailyResetAt)) return state
      const tx: BankTransaction = {
        id: uid(),
        type: 'reset',
        amountMins: 0,
        taskId: null,
        note: `Daily reset — bank set to ${DAILY_START_MINS} min (was ${state.balanceMins} min)`,
        createdAt: now(),
      }
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        balanceMins: DAILY_START_MINS,
        activeBreakId: null,
        lastDailyResetAt: now(),
      }
    }

    case 'RESET_BANK': {
      const tx: BankTransaction = {
        id: uid(),
        type: 'reset',
        amountMins: 0,
        taskId: null,
        note: `Bank reset (was ${state.balanceMins} min)`,
        createdAt: now(),
      }
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        balanceMins: 0,
        activeBreakId: null,
      }
    }

    case 'START_BREAK': {
      const mins = Math.max(0, Math.round(action.requestedMins))
      if (mins <= 0 || mins > state.balanceMins) return state
      const session = {
        id: uid(),
        requestedMins: mins,
        actualMins: 0,
        startedAt: now(),
        endedAt: null,
      }
      const tx: BankTransaction = {
        id: uid(),
        type: 'debit',
        amountMins: -mins,
        taskId: null,
        note: `Break started (${mins} min)`,
        createdAt: now(),
      }
      return {
        ...state,
        breakSessions: [session, ...state.breakSessions],
        transactions: [tx, ...state.transactions],
        balanceMins: state.balanceMins - mins,
        activeBreakId: session.id,
      }
    }

    case 'END_BREAK': {
      if (!state.activeBreakId) return state
      const session = state.breakSessions.find((b) => b.id === state.activeBreakId)
      if (!session) return { ...state, activeBreakId: null }
      const actual = Math.max(0, Math.min(session.requestedMins, Math.round(action.actualMins)))
      const refund = session.requestedMins - actual
      let next: AppState = {
        ...state,
        activeBreakId: null,
        breakSessions: state.breakSessions.map((b) =>
          b.id === session.id ? { ...b, actualMins: actual, endedAt: now() } : b,
        ),
      }
      // Return unused time to the bank (PRD §4.2.2).
      if (refund > 0) {
        next = credit(next, refund, null, `Break ended early (+${refund} min returned)`)
      }
      return next
    }

    case 'EXTEND_BREAK': {
      const extra = Math.max(0, Math.round(action.extraMins))
      if (!state.activeBreakId || extra <= 0 || extra > state.balanceMins) return state
      const tx: BankTransaction = {
        id: uid(),
        type: 'debit',
        amountMins: -extra,
        taskId: null,
        note: `Break extended (+${extra} min)`,
        createdAt: now(),
      }
      return {
        ...state,
        balanceMins: state.balanceMins - extra,
        transactions: [tx, ...state.transactions],
        breakSessions: state.breakSessions.map((b) =>
          b.id === state.activeBreakId
            ? { ...b, requestedMins: b.requestedMins + extra }
            : b,
        ),
      }
    }

    default:
      return state
  }
}
