import SmartImage from './SmartImage'
import useCart from '../hooks/useCart'
import { formatPrice } from '../utils/format'

export function VegBadge({ isVeg }) {
  return (
    <span className={isVeg ? 'veg-badge veg-badge--veg' : 'veg-badge'} title={isVeg ? 'Veg' : 'Non-veg'}>
      ●
    </span>
  )
}

export default function MenuItemCard({ item, restaurantId, restaurantName }) {
  const cart = useCart()
  const qty = cart.qtyOf(restaurantId, item.id)

  /** Cart mein sirf zaroori fields — poora Firestore doc copy nahi hota. */
  function handleAdd() {
    const cartItem = {
      itemId: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      imageUrl: item.imageUrl ?? '',
      isVeg: Boolean(item.isVeg),
      restaurantId,
      restaurantName: restaurantName ?? item.restaurantName ?? '',
    }

    // Swiggy rule: ek cart = ek restaurant.
    if (cart.cartRestaurantId && cart.cartRestaurantId !== restaurantId) {
      const currentName = cart.cartRestaurantName || cartItem.restaurantName
      const confirmed = window.confirm(
        `Aapke cart mein "${currentName}" ke items hain. Naya restaurant add karne pe cart replace ho jaayega. Continue?`,
      )
      if (!confirmed) return
      cart.addItem(cartItem, { replaceExisting: true })
      return
    }

    cart.addItem(cartItem)
  }

  return (
    <article className="menu-item">
      <div className="menu-item__info">
        <div className="menu-item__name-row">
          <VegBadge isVeg={item.isVeg || false} />
          <h4>{item.name}</h4>
        </div>
        <p className="menu-item__price">{formatPrice(item.price)}</p>
        {item.description ? <p className="menu-item__desc">{item.description}</p> : null}
        {!item.isAvailable ? <span className="menu-item__sold-out">Sold out</span> : null}
      </div>

      <div className="menu-item__media">
        <SmartImage className="menu-item__image" src={item.imageUrl} alt={item.name} emoji="🍳" />

        {qty === 0 ? (
          <button
            type="button"
            className="btn btn--primary menu-item__add-btn"
            disabled={!item.isAvailable}
            onClick={handleAdd}
            aria-label={`Add ${item.name} to cart`}
          >
            ADD
          </button>
        ) : (
          <div className="qty-controls" aria-label={`${item.name} quantity`}>
            <button type="button" onClick={() => cart.changeQty(restaurantId, item.id, qty - 1)} aria-label="Decrease quantity">
              −
            </button>
            <span>{qty}</span>
            <button type="button" onClick={() => cart.changeQty(restaurantId, item.id, qty + 1)} aria-label="Increase quantity">
              +
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
