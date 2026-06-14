// App-wide store: wires the reducer to localStorage persistence and exposes
// a typed dispatch via React context. Also provides a shared 1s "tick" so
// live timers across the app re-render in sync without each owning a clock.

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { reducer, type Action } from './reducer'
import { loadState, saveState } from '../storage/localStore'
import { api, ApiError } from '../api/client'
import { useAuth } from './auth'
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
      <SyncManager state={state} dispatch={dispatch} />
      <TickProvider>{children}</TickProvider>
    </StoreContext.Provider>
  )
}

/**
 * Bridges local state with the backend when a user is signed in:
 * pulls the authoritative snapshot on login, then pushes (debounced)
 * on every change with optimistic last-write-wins (PRD §5.2).
 */
function SyncManager({
  state,
  dispatch,
}: {
  state: AppState
  dispatch: React.Dispatch<Action>
}) {
  const { token } = useAuth()
  const versionRef = useRef(0)
  const hydratedRef = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a ref to the latest state for event-driven (reconnect) syncs.
  const stateRef = useRef(state)
  stateRef.current = state

  // Pull authoritative state when a token appears.
  useEffect(() => {
    hydratedRef.current = false
    if (!token) return
    let cancelled = false
    api
      .getState(token)
      .then(({ state: remote, version }) => {
        if (cancelled) return
        versionRef.current = version
        if (remote && remote.tasks) dispatch({ type: 'HYDRATE', state: remote })
        hydratedRef.current = true
      })
      .catch((err) => console.error('State pull failed', err))
    return () => {
      cancelled = true
    }
  }, [token, dispatch])

  // When the connection returns, flush the latest local state to the server
  // so edits made offline are synced (PRD §5.4 offline queue).
  useEffect(() => {
    if (!token) return
    const onReconnect = async () => {
      if (!hydratedRef.current) return
      try {
        const { version } = await api.putState(token, stateRef.current, versionRef.current)
        versionRef.current = version
      } catch (err) {
        console.error('Reconnect sync failed', err)
      }
    }
    window.addEventListener('online', onReconnect)
    return () => window.removeEventListener('online', onReconnect)
  }, [token])

  // Push debounced after local changes (only once hydrated, to avoid clobbering).
  useEffect(() => {
    if (!token || !hydratedRef.current) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      try {
        const { version } = await api.putState(token, state, versionRef.current)
        versionRef.current = version
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // Server moved ahead — re-pull and adopt it.
          const { state: remote, version } = await api.getState(token)
          versionRef.current = version
          if (remote && remote.tasks) dispatch({ type: 'HYDRATE', state: remote })
        } else {
          console.error('State push failed', err)
        }
      }
    }, 800)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [state, token, dispatch])

  return null
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
