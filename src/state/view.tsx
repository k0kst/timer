// Top-level view mode shared across the app: the default home page, the
// task focus view, the break countdown view, and history. Components use this
// to navigate between modes (e.g. "back to tasks") while the underlying
// task/break stays active.

import { createContext, useContext } from 'react'

export type ViewName = 'home' | 'focus' | 'break' | 'history'

interface ViewContextValue {
  view: ViewName
  setView: (v: ViewName) => void
  /** The task currently being focused on (running or paused), if any. */
  focusTaskId: string | null
}

export const ViewContext = createContext<ViewContextValue | null>(null)

export function useView(): ViewContextValue {
  const ctx = useContext(ViewContext)
  if (!ctx) throw new Error('useView must be used within ViewContext')
  return ctx
}
