// Auth context: holds the JWT + username, persisted to localStorage so the
// 30-day session survives refreshes (PRD §5.1). No-ops gracefully when no
// backend is configured.

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { api, backendConfigured } from '../api/client'

const TOKEN_KEY = 'bountytimer:auth'

interface StoredAuth {
  token: string
  username: string
}

interface AuthContextValue {
  token: string | null
  username: string | null
  backendConfigured: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function load(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(load)

  const persist = useCallback((next: StoredAuth | null) => {
    setAuth(next)
    if (next) localStorage.setItem(TOKEN_KEY, JSON.stringify(next))
    else localStorage.removeItem(TOKEN_KEY)
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await api.login(username, password)
      persist({ token: res.token, username: res.username })
    },
    [persist],
  )

  const register = useCallback(
    async (username: string, password: string, email?: string) => {
      const res = await api.register(username, password, email)
      persist({ token: res.token, username: res.username })
    },
    [persist],
  )

  const logout = useCallback(() => persist(null), [persist])

  return (
    <AuthContext.Provider
      value={{
        token: auth?.token ?? null,
        username: auth?.username ?? null,
        backendConfigured,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
