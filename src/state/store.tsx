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
import { loadState, saveState, STORAGE_KEY, DEV_STORAGE_KEY } from '../storage/localStore'
import { api, ApiError } from '../api/client'
import { useAuth } from './auth'
import type { AppState } from '../types'

interface StoreContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  /** Testing mode: a sandbox that never persists to or syncs the real account. */
  devMode: boolean
  setDevMode: (on: boolean) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)
const TickContext = createContext<number>(0)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState())
  const [devMode, setDevModeState] = useState(false)

  // Persist on every change — to the sandbox key while testing, otherwise the
  // real account. This keeps testing-mode experiments out of the user's data.
  useEffect(() => {
    saveState(state, devMode ? DEV_STORAGE_KEY : STORAGE_KEY)
  }, [state, devMode])

  // On load: re-arm recurring tasks / archive yesterday's one-offs (PRD §4.1.2)
  // and top the Break Bank back up to its daily starting balance.
  useEffect(() => {
    dispatch({ type: 'ARCHIVE_OLD' })
    dispatch({ type: 'DAILY_RESET' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap between the real account and the testing sandbox. Each side keeps its
  // own localStorage snapshot, so toggling back and forth is lossless.
  const setDevMode = (on: boolean) => {
    if (on === devMode) return
    if (on) {
      const sandbox = loadState(DEV_STORAGE_KEY)
      setDevModeState(true)
      dispatch({ type: 'HYDRATE', state: sandbox })
      dispatch({ type: 'ARCHIVE_OLD' })
      dispatch({ type: 'DAILY_RESET' })
    } else {
      const real = loadState(STORAGE_KEY)
      setDevModeState(false)
      dispatch({ type: 'HYDRATE', state: real })
    }
  }

  return (
    <StoreContext.Provider value={{ state, dispatch, devMode, setDevMode }}>
      <SyncManager state={state} dispatch={dispatch} enabled={!devMode} />
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
  enabled,
}: {
  state: AppState
  dispatch: React.Dispatch<Action>
  enabled: boolean
}) {
  const { token } = useAuth()
  const versionRef = useRef(0)
  const hydratedRef = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a ref to the latest state for event-driven (reconnect) syncs.
  const stateRef = useRef(state)
  stateRef.current = state

  // Pull authoritative state when a token appears (skipped while testing).
  useEffect(() => {
    hydratedRef.current = false
    if (!token || !enabled) return
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
  }, [token, dispatch, enabled])

  // When the connection returns, flush the latest local state to the server
  // so edits made offline are synced (PRD §5.4 offline queue).
  useEffect(() => {
    if (!token || !enabled) return
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
  }, [token, enabled])

  // Push debounced after local changes (only once hydrated, to avoid clobbering).
  useEffect(() => {
    if (!token || !enabled || !hydratedRef.current) return
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
  }, [state, token, dispatch, enabled])

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
