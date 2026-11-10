import useCart from '../hooks/useCart'
import useUI from '../hooks/useUI'
import { formatPrice } from '../utils/format'

/** Mobile/desktop sticky "View cart" bar — Swiggy jaisa. */
export default function CartBar() {
  const cart = useCart()
  const { isCartOpen, openCart } = useUI()

  if (cart.count === 0 || isCartOpen) return null

  return (
    <div className="cart-bar" role="region" aria-label="Cart summary">
      <button type="button" className="cart-bar__button" onClick={openCart}>
        <span className="cart-bar__count">
          {cart.count} item{cart.count === 1 ? '' : 's'}
        </span>
        <span className="cart-bar__total">{formatPrice(cart.subtotal)}</span>
        <span className="cart-bar__cta">View Cart →</span>
      </button>
    </div>
  )
}
