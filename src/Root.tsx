import { App } from './App'
import { AuthScreen } from './views/AuthScreen'
import { useAuth } from './state/auth'

/** Gate the app behind sign-in only when a backend is configured.
 *  With no backend (VITE_API_URL unset) the app runs fully local. */
export function Root() {
  const { backendConfigured, token } = useAuth()
  if (backendConfigured && !token) return <AuthScreen />
  return <App />
}
