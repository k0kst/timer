// Tiny API client. When VITE_API_URL is unset the app runs purely local
// (localStorage only) — the backend is an optional cross-device layer.

import type { AppState } from '../types'

export const API_URL: string | undefined = import.meta.env.VITE_API_URL

export const backendConfigured = Boolean(API_URL)

export interface AuthResult {
  token: string
  username: string
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function req<T>(path: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = opts
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  return data as T
}

export const api = {
  register: (username: string, password: string, email?: string) =>
    req<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    }),

  login: (username: string, password: string) =>
    req<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getState: (token: string) =>
    req<{ state: AppState | null; version: number }>('/state', { token }),

  putState: (token: string, state: AppState, baseVersion: number) =>
    req<{ version: number }>('/state', {
      method: 'PUT',
      token,
      body: JSON.stringify({ state, baseVersion }),
    }),
}

export { ApiError }
