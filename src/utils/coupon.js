import { COUPONS } from '../constants'
import { formatPrice } from './format'

/** Code ko normalize karke coupon object dhoondo. Nahi mila to `null`. */
export function findCoupon(code) {
  const key = String(code ?? '').trim().toUpperCase()
  return COUPONS[key] ?? null
}

/**
 * Coupon ko cart ke hisaab se apply karo.
 * Returns `{ discount, freeDelivery }` ya `{ error }` (min order se kam / invalid).
 */
export function couponForCart(coupon, itemsTotal) {
  if (!coupon) return { error: 'Coupon code galat hai.' }

  if (itemsTotal < coupon.minOrder) {
    return {
      error: `${coupon.code} ke liye minimum order ${formatPrice(coupon.minOrder)} hai — abhi ${formatPrice(itemsTotal)} ka cart hai.`,
    }
  }

  if (coupon.type === 'freeDelivery') {
    return { discount: 0, freeDelivery: true }
  }

  if (coupon.type === 'flat') {
    return { discount: coupon.value, freeDelivery: false }
  }

  // percent
  const raw = Math.round((itemsTotal * coupon.value) / 100)
  return { discount: Math.min(raw, coupon.maxDiscount), freeDelivery: false }
}
