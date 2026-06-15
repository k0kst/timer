import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './state/auth'
import { StoreProvider } from './state/store'
import { Root } from './Root'
import { ErrorBoundary } from './components/ErrorBoundary'
import { registerServiceWorker } from './utils/registerSW'
import './styles.css'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <Root />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
