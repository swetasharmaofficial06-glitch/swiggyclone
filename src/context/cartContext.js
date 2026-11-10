import { createContext } from 'react'

export const CART_STORAGE_KEY = 'swiggy-clone:cart'

export const CartContext = createContext(null)

/** localStorage se cart padho — corrupt/blocked ho toh empty cart. */
export function loadInitialCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** state shape: { [`${restaurantId}:${itemId}`]: { ...item, qty } } */
export function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = `${action.item.restaurantId}:${action.item.itemId}`
      const existing = state[key]
      const qty = existing ? existing.qty + 1 : 1
      if (action.replaceExisting) return { [key]: { ...action.item, qty } }
      return { ...state, [key]: { ...action.item, qty } }
    }
    case 'CHANGE_QTY': {
      const { key, qty } = action
      if (!state[key]) return state
      if (qty <= 0) {
        const next = { ...state }
        delete next[key]
        return next
      }
      return { ...state, [key]: { ...state[key], qty } }
    }
    case 'CLEAR_CART':
      return {}
    default:
      return state
  }
}
