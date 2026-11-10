import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page">
      <div className="empty-state">
        <div className="empty-state__emoji">🍽️</div>
        <h2>404 — Page nahi mila</h2>
        <p className="empty-state__hint">Jo page aap dhoondh rahe ho wo exist nahi karta.</p>
        <Link to="/" className="btn btn--primary">Back to home</Link>
      </div>
    </main>
  )
}
