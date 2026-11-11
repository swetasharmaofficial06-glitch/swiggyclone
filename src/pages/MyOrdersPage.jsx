import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { ORDER_FLOW, ORDER_STATUS, subscribeMyOrders } from '../services/orderService'
import { cx, formatPrice } from '../utils/format'
import GoogleIcon from '../components/GoogleIcon'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
})

function formatDate(timestamp) {
  if (!timestamp?.toDate) return 'Just now'
  try {
    return dateFormatter.format(timestamp.toDate())
  } catch {
    return 'Just now'
  }
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return ''
  try {
    return timeFormatter.format(timestamp.toDate())
  } catch {
    return ''
  }
}

/** Status ke hisaab se kaunsa step done/active/pending hai. */
function OrderTimeline({ order }) {
  if (order.status === 'cancelled') {
    const cancelledAt = (order.statusHistory ?? []).find((entry) => entry.status === 'cancelled')?.at
    return (
      <div className="order-timeline order-timeline--cancelled">
        <span className="order-timeline__cancel-emoji">❌</span>
        <div>
          <strong>Order cancelled</strong>
          <p>{cancelledAt ? `Cancelled at ${formatTime(cancelledAt)}` : 'Ye order cancel ho gaya.'}</p>
        </div>
      </div>
    )
  }

  const currentIndex = Math.max(ORDER_FLOW.indexOf(order.status), 0)
  const history = new Map()
  if (order.createdAt) history.set('placed', order.createdAt)
  ;(order.statusHistory ?? []).forEach((entry) => {
    if (entry?.status && entry?.at) history.set(entry.status, entry.at)
  })

  return (
    <ol className="order-timeline" aria-label="Order progress">
      {ORDER_FLOW.map((status, index) => {
        const meta = ORDER_STATUS[status]
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending'

        return (
          <li key={status} className={`order-timeline__step order-timeline__step--${state}`}>
            <span className="order-timeline__dot" aria-hidden="true">
              {state === 'done' ? '✓' : state === 'active' ? meta.emoji : '•'}
            </span>
            <span className="order-timeline__label">{meta.label}</span>
            <span className="order-timeline__time">
              {state !== 'pending' && history.get(status) ? formatTime(history.get(status)) : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default function MyOrdersPage() {
  const { user, initializing, signingIn, signIn } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setOrders([])
      setLoading(false)
      setError(null)
      return undefined
    }

    setLoading(true)
    const unsubscribe = subscribeMyOrders(
      user.uid,
      (list) => {
        setOrders(list)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  return (
    <main className="page orders-page">
      <header className="orders-page__header">
        <div>
          <h1>My Orders 📦</h1>
          <p className="muted-text">
            {user
              ? `Aapke ${user.email} account ke saare orders, newest first.`
              : 'Apne orders dekhne ke liye Google se sign in karo.'}
          </p>
        </div>
        <Link to="/" className="btn btn--outline btn--small">
          ← Browse restaurants
        </Link>
      </header>

      {initializing ? (
        <Loader label="Account check ho raha hai…" />
      ) : !user ? (
        <div className="access-gate">
          <div className="access-gate__emoji">🔐</div>
          <h2>Sign in karke orders dekho</h2>
          <p className="muted-text">
            Aapke orders Google account se linked hain — sign in karte hi poori list dikh jayegi.
          </p>
          <button type="button" className="btn btn--primary" onClick={signIn} disabled={signingIn}>
            <GoogleIcon size={18} />
            <span>{signingIn ? 'Signing in…' : 'Continue with Google'}</span>
          </button>
        </div>
      ) : loading ? (
        <Loader label="Orders load ho rahe hain…" />
      ) : error ? (
        <EmptyState
          emoji="🚨"
          title="Orders load nahi hue"
          hint={error.message ?? 'Kuch galat ho gaya, page refresh karke dobara try karo.'}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title="Abhi tak koi order nahi"
          hint="Restaurant choose karo, cart bharo aur order place karo — phir yahan dikhega."
        >
          <Link to="/" className="btn btn--primary">
            Order food
          </Link>
        </EmptyState>
      ) : (
        <ul className="orders-list">
          {orders.map((order) => {
            const status = ORDER_STATUS[order.status] ?? { label: order.status ?? 'Placed', emoji: '📝' }
            const items = order.items ?? []

            return (
              <li key={order.id} className="order-card">
                <div className="order-card__head">
                  <div>
                    <p className="order-card__restaurant">{order.restaurantName}</p>
                    <p className="order-card__meta">
                      #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={cx('order-status', `order-status--${order.status}`)}>
                    {status.emoji} {status.label}
                  </span>
                </div>

                <OrderTimeline order={order} />

                <ul className="order-card__items">
                  {items.map((item, index) => (
                    <li key={`${order.id}-${item.itemId ?? index}`}>
                      <span>
                        {item.name} × {item.qty}
                      </span>
                      <span>{formatPrice(Number(item.price || 0) * Number(item.qty || 0))}</span>
                    </li>
                  ))}
                </ul>

                {Number(order.discount || 0) > 0 ? (
                  <p className="order-card__saving">
                    🎟️ {order.couponCode || 'Coupon'} · Saved {formatPrice(order.discount)}
                  </p>
                ) : null}

                <div className="order-card__foot">
                  <span>
                    {order.itemCount ?? items.length} item{(order.itemCount ?? items.length) === 1 ? '' : 's'} ·{' '}
                    {order.customer?.payment === 'upi' ? 'UPI' : 'Cash on Delivery'}
                  </span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
