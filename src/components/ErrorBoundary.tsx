import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Catches render errors so a bug never leaves the user on a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-screen">
          <div className="card auth-card" style={{ textAlign: 'center' }}>
            <h3>Something went wrong</h3>
            <p className="hint" style={{ margin: '8px 0 18px' }}>
              Your data is safe. Reloading usually fixes this.
            </p>
            <button className="btn primary" style={{ width: '100%' }} onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
