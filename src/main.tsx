import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './state/auth'
import { StoreProvider } from './state/store'
import { Root } from './Root'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </AuthProvider>
  </StrictMode>,
)
