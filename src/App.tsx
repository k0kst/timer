import { useState } from 'react'
import { MiniBar } from './components/MiniBar'
import { TasksView } from './views/TasksView'
import { BankView } from './views/BankView'
import { HistoryView } from './views/HistoryView'
import { Onboarding, hasOnboarded } from './components/Onboarding'
import { useOnline } from './utils/useOnline'
import { useAuth } from './state/auth'

type Tab = 'tasks' | 'bank' | 'history'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'bank', label: 'Bank', icon: '🏦' },
  { id: 'history', label: 'History', icon: '📊' },
]

export function App() {
  const [tab, setTab] = useState<Tab>('tasks')
  const [onboarding, setOnboarding] = useState(() => !hasOnboarded())
  const online = useOnline()
  const { backendConfigured } = useAuth()

  return (
    <div className="app">
      <nav className="bottom-nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            <span className="ico">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="main-col">
        <MiniBar />
        {backendConfigured && !online && (
          <div className="offline-banner">
            ⚠ Offline — changes are saved locally and will sync when you reconnect.
          </div>
        )}
        <main className="content">
          {tab === 'tasks' && <TasksView />}
          {tab === 'bank' && <BankView />}
          {tab === 'history' && <HistoryView />}
        </main>
      </div>

      {onboarding && <Onboarding onClose={() => setOnboarding(false)} />}
    </div>
  )
}
