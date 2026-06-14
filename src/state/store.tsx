// App-wide store: wires the reducer to localStorage persistence and exposes
// a typed dispatch via React context. Also provides a shared 1s "tick" so
// live timers across the app re-render in sync without each owning a clock.

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import { reducer, type Action } from './reducer'
import { loadState, saveState } from '../storage/localStore'
import type { AppState } from '../types'

interface StoreContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreContextValue | null>(null)
const TickContext = createContext<number>(0)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // Persist on every change.
  useEffect(() => {
    saveState(state)
  }, [state])

  // Archive yesterday's completed tasks once on load (PRD §4.1.2).
  useEffect(() => {
    dispatch({ type: 'ARCHIVE_OLD' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <TickProvider>{children}</TickProvider>
    </StoreContext.Provider>
  )
}

function TickProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return <TickContext.Provider value={tick}>{children}</TickContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/** A value that changes every second; subscribe to drive live timers. */
export function useTick(): number {
  return useContext(TickContext)
}
