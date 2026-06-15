import { useEffect, useRef, useState } from 'react'
import { MiniBar } from './components/MiniBar'
import { TasksView } from './views/TasksView'
import { BankView } from './views/BankView'
import { HistoryView } from './views/HistoryView'
import { FocusView } from './views/FocusView'
import { BreakView } from './views/BreakView'
import { Onboarding, hasOnboarded } from './components/Onboarding'
import { useOnline } from './utils/useOnline'
import { useAuth } from './state/auth'
import { useStore } from './state/store'
import { ViewContext, type ViewName } from './state/view'

export function App() {
  const { state, devMode } = useStore()
  const online = useOnline()
  const { backendConfigured } = useAuth()
  const [onboarding, setOnboarding] = useState(() => !hasOnboarded())

  const runningTask = state.tasks.find((t) => t.runningSince) ?? null
  const onBreak = Boolean(state.activeBreakId)

  // A focus session tracks the task being worked, preserved across pauses so the
  // user can leave and return to the focus view while it stays active.
  const [focusTaskId, setFocusTaskId] = useState<string | null>(() => runningTask?.id ?? null)
  const [view, setView] = useState<ViewName>(() =>
    onBreak ? 'break' : runningTask ? 'focus' : 'home',
  )

  // Focus auto-activates the moment a task starts running (rising edge).
  const prevRunning = useRef(runningTask?.id ?? null)
  useEffect(() => {
    const id = runningTask?.id ?? null
    if (id && id !== prevRunning.current) {
      setFocusTaskId(id)
      setView('focus')
    }
    prevRunning.current = id
  }, [runningTask])

  // Drop the focus session once its task is completed or no longer exists.
  useEffect(() => {
    if (!focusTaskId) return
    const t = state.tasks.find((x) => x.id === focusTaskId)
    if (!t || t.status === 'complete' || t.status === 'archived') {
      setFocusTaskId(null)
      setView((v) => (v === 'focus' ? 'home' : v))
    }
  }, [state.tasks, focusTaskId])

  // Break mode auto-activates when a break starts and steps aside when it ends.
  const prevBreak = useRef(onBreak)
  useEffect(() => {
    if (onBreak && !prevBreak.current) setView('break')
    if (!onBreak && prevBreak.current) setView((v) => (v === 'break' ? 'home' : v))
    prevBreak.current = onBreak
  }, [onBreak])

  const tabs: { id: ViewName; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    ...(focusTaskId ? [{ id: 'focus' as ViewName, label: 'Focus', icon: '🎯' }] : []),
    ...(onBreak ? [{ id: 'break' as ViewName, label: 'Break', icon: '☕' }] : []),
    { id: 'history', label: 'History', icon: '📊' },
  ]

  const immersive = view === 'focus' || view === 'break'

  return (
    <ViewContext.Provider value={{ view, setView, focusTaskId }}>
      <div className="app">
        <nav className="bottom-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={view === t.id ? 'active' : ''}
              onClick={() => setView(t.id)}
            >
              <span className="ico">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="main-col">
          {!immersive && <MiniBar />}
          {devMode && (
            <div className="dev-banner">
              🧪 Testing mode — changes are sandboxed and won't affect your real data.
            </div>
          )}
          {backendConfigured && !online && (
            <div className="offline-banner">
              ⚠ Offline — changes are saved locally and will sync when you reconnect.
            </div>
          )}
          <main className={`content ${view === 'home' ? 'wide' : ''}`}>
            {view === 'home' && (
              <div className="home-grid">
                <section className="home-tasks">
                  <TasksView />
                </section>
                <section className="home-bank">
                  <BankView />
                </section>
              </div>
            )}
            {view === 'focus' && <FocusView />}
            {view === 'break' && <BreakView />}
            {view === 'history' && <HistoryView />}
          </main>
        </div>

        {onboarding && <Onboarding onClose={() => setOnboarding(false)} />}
      </div>
    </ViewContext.Provider>
  )
}
