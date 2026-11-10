import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import { FEES } from '../constants'
import { calculateBill, formatPrice } from '../utils/format'
import GoogleIcon from './GoogleIcon'
import SmartImage from './SmartImage'
import UserAvatar from './UserAvatar'

const EMPTY_CUSTOMER = { name: '', phone: '', address: '', payment: 'cod' }
const PHONE_REGEX = /^[6-9]\d{9}$/

export default function CartDrawer({ open, onClose }) {
  const cart = useCart()
  const navigate = useNavigate()
  const { user, initializing, signingIn, signIn } = useAuth()
  const [view, setView] = useState('cart')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  /** Drawer khula ho toh background scroll lock. */
  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  /** Sign-in hone pe delivery name prefill — par user ka typed naam overwrite nahi hota. */
  useEffect(() => {
    if (!user) return
    setCustomer((prev) => (prev.name.trim() ? prev : { ...prev, name: user.displayName ?? '' }))
  }, [user])

  if (!open) return null

  const bill = calculateBill(cart.subtotal, FEES)
  const freeDeliveryGap = FEES.freeDeliveryAbove - cart.subtotal

  function handleClose() {
    onClose()
    setError(null)
    if (view === 'success') {
      setView('cart')
      setOrder(null)
      setCustomer(EMPTY_CUSTOMER)
    }
  }

  function update(field, value) {
    setCustomer((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCheckout(event) {
    event.preventDefault()
    setError(null)

    if (!user) {
      setError('Order place karne ke liye pehle Google se sign in karo.')
      return
    }

    const phone = customer.phone.replace(/\D/g, '')
    if (customer.name.trim().length < 2) {
      setError('Apna naam daalo (kam se kam 2 characters).')
      return
    }
    if (!PHONE_REGEX.test(phone)) {
      setError('Valid 10-digit Indian mobile number daalo.')
      return
    }
    if (customer.address.trim().length < 10) {
      setError('Delivery address thoda detail mein likho (kam se kam 10 characters).')
      return
    }
    if (cart.items.length === 0) {
      setError('Cart khali hai.')
      return
    }

    setSubmitting(true)
    try {
      // Firestore sirf checkout ke waqt load hota hai — initial bundle chhota rehta hai.
      const { placeOrder } = await import('../services/orderService')
      const orderId = await placeOrder({
        customer: { ...customer, phone },
        items: cart.items,
        bill,
      })
      setOrder({ id: orderId, total: bill.total })
      setView('success')
      cart.clearCart()
    } catch (err) {
      setError(err.message ?? 'Order place nahi hua. Dobara try karo.')
    } finally {
      setSubmitting(false)
    }
  }

  const title = view === 'success' ? 'Order placed 🎉' : view === 'checkout' ? 'Checkout' : 'Your Cart'

  return (
    <>
      <div className="cart-overlay" onClick={handleClose} aria-hidden="true" />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="cart-drawer__header">
          <div>
            <h3>{title}</h3>
            {cart.cartRestaurantName && view !== 'success' ? (
              <p className="cart-drawer__restaurant">{cart.cartRestaurantName}</p>
            ) : null}
          </div>
          <button type="button" className="cart-drawer__close" onClick={handleClose} aria-label="Close cart">
            ✕
          </button>
        </header>

        {view === 'success' ? (
          <div className="order-success">
            <div className="order-success__emoji">🎉</div>
            <h4>Order place ho gaya!</h4>
            <p className="muted-text">Order ID</p>
            <code className="order-success__id">#{order?.id?.slice(0, 8).toUpperCase()}</code>
            <p className="muted-text">Paid amount: <strong>{formatPrice(order?.total)}</strong></p>
            <p className="muted-text">
              Restaurant aapka order jaldi accept karega. (Demo app — real delivery nahi hogi.)
            </p>
            <button
              type="button"
              className="btn btn--outline btn--block"
              onClick={() => {
                handleClose()
                navigate('/orders')
              }}
            >
              📦 View my orders
            </button>
            <button type="button" className="btn btn--primary btn--block" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="cart-drawer__empty">
            <div className="cart-drawer__empty-emoji">🛒</div>
            <p className="cart-drawer__empty-title">Your cart is empty</p>
            <p className="muted-text">Restaurant choose karo aur tasty food add karo!</p>
            <button type="button" className="btn btn--outline" onClick={handleClose}>
              Browse restaurants
            </button>
          </div>
        ) : view === 'checkout' ? (
          initializing ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-emoji">🔐</div>
              <p className="cart-drawer__empty-title">Checking sign-in…</p>
              <p className="muted-text">Ek second, aapka account check ho raha hai.</p>
            </div>
          ) : !user ? (
            <div className="auth-card">
              <div className="auth-card__emoji">🔐</div>
              <h4 className="auth-card__title">Sign in karke order karo</h4>
              <p className="muted-text">
                Order place karne ke liye Google se sign in karna zaroori hai. Aapka cart safe
                rahega — sign in ke baad seedha checkout khul jayega.
              </p>
              <button
                type="button"
                className="btn btn--primary btn--block auth-card__google"
                onClick={signIn}
                disabled={signingIn}
              >
                <GoogleIcon size={18} />
                <span>{signingIn ? 'Signing in…' : 'Continue with Google'}</span>
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('cart')}>
                ← Back to cart
              </button>
              <p className="auth-card__note">
                Aapka email sirf order ki receipt aur order history ke liye use hota hai.
              </p>
            </div>
          ) : (
            <form className="cart-checkout" onSubmit={handleCheckout}>
              <div className="signed-in-banner">
                <UserAvatar user={user} />
                <div className="signed-in-banner__info">
                  <p className="signed-in-banner__name">{user.displayName || 'Google user'}</p>
                  <p className="signed-in-banner__email">{user.email}</p>
                </div>
                <span className="signed-in-banner__badge">Signed in</span>
              </div>

              <div className="form-field">
                <label htmlFor="checkout-name">Naam *</label>
                <input
                  id="checkout-name"
                  value={customer.name}
                  onChange={(event) => update('name', event.target.value)}
                  autoComplete="name"
                  placeholder="Pooja Sharma"
                />
              </div>
              <div className="form-field">
                <label htmlFor="checkout-phone">Mobile number *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  inputMode="numeric"
                  value={customer.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  autoComplete="tel"
                  placeholder="9876543210"
                />
              </div>
              <div className="form-field">
                <label htmlFor="checkout-address">Delivery address *</label>
                <textarea
                  id="checkout-address"
                  rows={3}
                  value={customer.address}
                  onChange={(event) => update('address', event.target.value)}
                  autoComplete="street-address"
                  placeholder="Flat / house no., street, area, city"
                />
              </div>
              <div className="form-field">
                <label htmlFor="checkout-payment">Payment mode</label>
                <select
                  id="checkout-payment"
                  value={customer.payment}
                  onChange={(event) => update('payment', event.target.value)}
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="upi">UPI (demo)</option>
                </select>
              </div>

              <div className="bill-card">
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>{formatPrice(bill.itemsTotal)}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>{bill.deliveryFee === 0 ? 'FREE' : formatPrice(bill.deliveryFee)}</span>
                </div>
                <div className="bill-row">
                  <span>Platform Fee</span>
                  <span>{formatPrice(bill.platformFee)}</span>
                </div>
                <div className="bill-row">
                  <span>GST (5%)</span>
                  <span>{formatPrice(bill.gst)}</span>
                </div>
                <div className="bill-row bill-row--total">
                  <span>To Pay</span>
                  <strong>{formatPrice(bill.total)}</strong>
                </div>
              </div>

              <p className="muted-text">
                Demo checkout — payment gateway connected nahi hai, order sirf Firestore mein save hoga.
              </p>

              {error ? <p className="form-msg form-msg--error">{error}</p> : null}

              <div className="cart-checkout__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setView('cart')}>
                  ← Back
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Placing order…' : `Place Order · ${formatPrice(bill.total)}`}
                </button>
              </div>
            </form>
          )
        ) : (
          <>
            <ul className="cart-drawer__items">
              {cart.items.map((item) => {
                const key = `${item.restaurantId}:${item.itemId}`
                return (
                  <li key={key} className="cart-drawer__item">
                    <SmartImage
                      className="cart-drawer__thumb"
                      src={item.imageUrl}
                      alt={item.name}
                      emoji={item.isVeg ? '🥗' : '🍗'}
                    />
                    <div className="cart-drawer__item-info">
                      <p className="cart-drawer__item-name">{item.name}</p>
                      <p className="cart-drawer__item-price">
                        {formatPrice(item.price)} × {item.qty} = {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="qty-controls" aria-label={`${item.name} quantity`}>
                      <button type="button" onClick={() => cart.changeQtyByKey(key, item.qty - 1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => cart.changeQtyByKey(key, item.qty + 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            {freeDeliveryGap > 0 ? (
              <p className="free-delivery-nudge">
                Add {formatPrice(freeDeliveryGap)} more for <strong>FREE delivery</strong> 🚴
              </p>
            ) : null}

            <div className="bill-card">
              <div className="bill-row">
                <span>Item Total</span>
                <span>{formatPrice(bill.itemsTotal)}</span>
              </div>
              <div className="bill-row">
                <span>Delivery Fee</span>
                <span>{bill.deliveryFee === 0 ? 'FREE' : formatPrice(bill.deliveryFee)}</span>
              </div>
              <div className="bill-row">
                <span>Platform Fee</span>
                <span>{formatPrice(bill.platformFee)}</span>
              </div>
              <div className="bill-row">
                <span>GST (5%)</span>
                <span>{formatPrice(bill.gst)}</span>
              </div>
              <div className="bill-row bill-row--total">
                <span>To Pay</span>
                <strong>{formatPrice(bill.total)}</strong>
              </div>
            </div>

            <footer className="cart-drawer__footer">
              <button type="button" className="btn btn--primary btn--block" onClick={() => setView('checkout')}>
                Proceed to Checkout
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={cart.clearCart}>
                Clear cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
