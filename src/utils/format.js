export function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

/** 1250 → "1.2k", 2000000 → "2M" — bestseller badge ke liye. */
export function formatSoldCount(value) {
  const count = Number(value || 0)
  if (count >= 1000000) return `${(count / 1000000).toFixed(count % 1000000 === 0 ? 0 : 1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`
  return String(count)
}

/** "30-40 min" → 30 (sorting ke liye start minute) */
export function parseDeliveryMinutes(value) {
  const match = String(value ?? '').match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

/** Cart + fees ka final bill (coupon discount / free delivery optional). */
export function calculateBill(
  itemsTotal,
  { delivery, platform, gstRate, freeDeliveryAbove, discount = 0, freeDelivery = false },
) {
  const deliveryFee = freeDelivery || itemsTotal >= freeDeliveryAbove ? 0 : delivery
  const platformFee = platform
  const gst = Math.round(itemsTotal * gstRate)
  const gross = itemsTotal + deliveryFee + platformFee + gst
  const safeDiscount = Math.min(Math.max(0, Math.round(discount)), gross)
  return {
    itemsTotal,
    deliveryFee,
    platformFee,
    gst,
    discount: safeDiscount,
    total: gross - safeDiscount,
  }
}
