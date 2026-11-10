import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { CART_STORAGE_KEY, CartContext, cartReducer, loadInitialCart } from './cartContext'

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, null, loadInitialCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      /* storage full/blocked — cart memory mein chalega */
    }
  }, [cart])

  const items = useMemo(() => Object.values(cart), [cart])

  const addItem = useCallback((item, { replaceExisting = false } = {}) => {
    dispatch({ type: 'ADD_ITEM', item, replaceExisting })
  }, [])

  const changeQty = useCallback((restaurantId, itemId, qty) => {
    dispatch({ type: 'CHANGE_QTY', key: `${restaurantId}:${itemId}`, qty })
  }, [])

  const changeQtyByKey = useCallback((key, qty) => {
    dispatch({ type: 'CHANGE_QTY', key, qty })
  }, [])

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])

  const qtyOf = useCallback(
    (restaurantId, itemId) => cart[`${restaurantId}:${itemId}`]?.qty ?? 0,
    [cart],
  )

  const { count, subtotal } = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          count: acc.count + item.qty,
          subtotal: acc.subtotal + item.qty * item.price,
        }),
        { count: 0, subtotal: 0 },
      ),
    [items],
  )

  /** Cart kis restaurant ka hai (null = khali) */
  const cartRestaurantId = items[0]?.restaurantId ?? null
  const cartRestaurantName = items[0]?.restaurantName ?? ''

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      cartRestaurantId,
      cartRestaurantName,
      addItem,
      changeQty,
      changeQtyByKey,
      clearCart,
      qtyOf,
    }),
    [
      items,
      count,
      subtotal,
      cartRestaurantId,
      cartRestaurantName,
      addItem,
      changeQty,
      changeQtyByKey,
      clearCart,
      qtyOf,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
