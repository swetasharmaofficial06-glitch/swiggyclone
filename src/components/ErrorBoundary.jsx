import { Component } from 'react'

/** Render error ko friendly message mein badalta hai — poori app blank nahi hoti. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Production mein yahan Sentry/analytics bhej sakte ho.
    console.error('App render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page">
          <div className="empty-state">
            <div className="empty-state__emoji">😵</div>
            <h2>Kuch galat ho gaya</h2>
            <p className="empty-state__hint">{this.state.error.message}</p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Reload app
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
