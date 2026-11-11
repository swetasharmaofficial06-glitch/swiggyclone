import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import useAddresses from '../hooks/useAddresses'
import { ADDRESS_LABELS, COUPONS, FEES, MAX_ADDRESSES } from '../constants'
import { calculateBill, cx, formatPrice } from '../utils/format'
import { couponForCart, findCoupon } from '../utils/coupon'
import GoogleIcon from './GoogleIcon'
import SmartImage from './SmartImage'
import UserAvatar from './UserAvatar'

const EMPTY_CUSTOMER = { name: '', phone: '', address: '', payment: 'cod' }
const PHONE_REGEX = /^[6-9]\d{9}$/

export default function CartDrawer({ open, onClose }) {
  const cart = useCart()
  const navigate = useNavigate()
  const { user, initializing, signingIn, signIn } = useAuth()
  const { addresses } = useAddresses(user?.uid, Boolean(user))
  const [view, setView] = useState('cart')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  // Coupons
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponMessage, setCouponMessage] = useState(null)

  // Saved addresses
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressLabel, setAddressLabel] = useState('Home')

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

  // Coupon ka asar bill par (min order se kam ho jaye to error, discount nahi).
  const couponResult = appliedCoupon ? couponForCart(appliedCoupon, cart.subtotal) : null
  const activeCoupon = couponResult && !couponResult.error ? appliedCoupon : null
  const couponError = appliedCoupon && couponResult?.error ? couponResult.error : null

  const bill = calculateBill(cart.subtotal, {
    ...FEES,
    discount: couponResult?.discount ?? 0,
    freeDelivery: couponResult?.freeDelivery ?? false,
  })

  const freeDeliveryGap = activeCoupon?.type === 'freeDelivery' ? 0 : FEES.freeDeliveryAbove - cart.subtotal
  const couponFeedback = couponError
    ? { type: 'error', text: couponError }
    : couponMessage

  function handleClose() {
    onClose()
    setError(null)
    if (view === 'success') {
      setView('cart')
      setOrder(null)
      setCustomer(EMPTY_CUSTOMER)
      setCouponCode('')
      setAppliedCoupon(null)
      setCouponMessage(null)
      setSelectedAddressId('')
      setSaveAddress(false)
      setAddressLabel('Home')
    }
  }

  function update(field, value) {
    setCustomer((prev) => ({ ...prev, [field]: value }))
  }

  /** Address/phone manually badla to saved-address selection clear. */
  function updateDelivery(field, value) {
    setSelectedAddressId('')
    update(field, value)
  }

  function chooseSavedAddress(address) {
    setSelectedAddressId(address.id)
    setCustomer((prev) => ({ ...prev, address: address.address, phone: address.phone }))
    setSaveAddress(false)
  }

  function handleApplyCoupon(rawCode) {
    setError(null)
    const value = typeof rawCode === 'string' ? rawCode : couponCode
    const coupon = findCoupon(value)
    if (!coupon) {
      setAppliedCoupon(null)
      setCouponMessage({ type: 'error', text: 'Ye coupon code valid nahi hai.' })
      return
    }

    const result = couponForCart(coupon, cart.subtotal)
    if (result.error) {
      setAppliedCoupon(null)
      setCouponMessage({ type: 'error', text: result.error })
      return
    }

    setAppliedCoupon(coupon)
    setCouponCode(coupon.code)
    setCouponMessage({ type: 'success', text: `${coupon.code} applied — ${coupon.label}` })
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponMessage(null)
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
        bill: { ...bill, couponCode: activeCoupon?.code ?? '' },
      })

      // Best-effort: naya address save karo — fail ho to order na ruke.
      if (saveAddress && !selectedAddressId && addresses.length < MAX_ADDRESSES) {
        try {
          const { addAddress } = await import('../services/addressService')
          await addAddress(user.uid, {
            label: addressLabel,
            address: customer.address,
            phone,
            isDefault: addresses.length === 0,
          })
        } catch {
          // ignore — order already place ho chuka hai
        }
      }

      setOrder({
        id: orderId,
        total: bill.total,
        discount: bill.discount,
        couponCode: activeCoupon?.code ?? '',
      })
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
            {order?.discount > 0 ? (
              <p className="muted-text">
                🎟️ {order.couponCode} · Saved <strong>{formatPrice(order.discount)}</strong>
              </p>
            ) : null}
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

              {addresses.length > 0 ? (
                <div className="form-field">
                  <span className="form-label">Saved addresses</span>
                  <div className="saved-addresses">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        className={cx(
                          'saved-address',
                          selectedAddressId === address.id && 'saved-address--active',
                        )}
                        onClick={() => chooseSavedAddress(address)}
                      >
                        <strong>
                          {address.label === 'Home' ? '🏠' : address.label === 'Work' ? '🏢' : '📍'}{' '}
                          {address.label}
                          {address.isDefault ? ' · Default' : ''}
                        </strong>
                        <span>{address.address}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="form-field">
                <label htmlFor="checkout-phone">Mobile number *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  inputMode="numeric"
                  value={customer.phone}
                  onChange={(event) => updateDelivery('phone', event.target.value)}
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
                  onChange={(event) => updateDelivery('address', event.target.value)}
                  autoComplete="street-address"
                  placeholder="Flat / house no., street, area, city"
                />
              </div>

              {!selectedAddressId && addresses.length < MAX_ADDRESSES ? (
                <div className="save-address-box">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                    />
                    Ye address future ke liye save karo
                  </label>
                  {saveAddress ? (
                    <div className="address-label-row">
                      {ADDRESS_LABELS.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className={cx('chip', addressLabel === label && 'chip--active')}
                          onClick={() => setAddressLabel(label)}
                        >
                          {label === 'Home' ? '🏠' : label === 'Work' ? '🏢' : '📍'} {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
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

              <div className="coupon-box">
                <label className="form-label" htmlFor="checkout-coupon">
                  🎟️ Coupon code
                </label>
                <div className="coupon-box__row">
                  <input
                    id="checkout-coupon"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="WELCOME50 / FREEDEL / FLAT50"
                    disabled={Boolean(appliedCoupon)}
                  />
                  {appliedCoupon ? (
                    <button type="button" className="btn btn--ghost btn--small" onClick={removeCoupon}>
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--outline btn--small"
                      onClick={() => handleApplyCoupon()}
                    >
                      Apply
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="coupon-box__chips">
                    {Object.values(COUPONS).map((coupon) => (
                      <button
                        key={coupon.code}
                        type="button"
                        className="coupon-chip"
                        onClick={() => handleApplyCoupon(coupon.code)}
                        title={`Min order ₹${coupon.minOrder}`}
                      >
                        <strong>{coupon.code}</strong>
                        <span>{coupon.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {couponFeedback ? (
                  <p className={`form-msg form-msg--${couponFeedback.type}`}>{couponFeedback.text}</p>
                ) : null}
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
                {bill.discount > 0 ? (
                  <div className="bill-row bill-row--discount">
                    <span>🎟️ Coupon ({activeCoupon?.code})</span>
                    <span>− {formatPrice(bill.discount)}</span>
                  </div>
                ) : null}
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

            {activeCoupon ? (
              <p className="coupon-applied-note">
                🎟️ <strong>{activeCoupon.code}</strong> applied — {activeCoupon.label}
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
              {bill.discount > 0 ? (
                <div className="bill-row bill-row--discount">
                  <span>🎟️ Coupon ({activeCoupon?.code})</span>
                  <span>− {formatPrice(bill.discount)}</span>
                </div>
              ) : null}
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
