export default function EmptyState({ emoji = '🍽️', title, hint, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state__emoji">{emoji}</div>
      <h2>{title}</h2>
      {hint ? <p className="empty-state__hint">{hint}</p> : null}
      {children}
    </div>
  )
}
