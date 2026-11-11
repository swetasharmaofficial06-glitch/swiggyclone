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

/** Cart + fees ka final bill */
export function calculateBill(itemsTotal, { delivery, platform, gstRate, freeDeliveryAbove }) {
  const deliveryFee = itemsTotal >= freeDeliveryAbove ? 0 : delivery
  const platformFee = platform
  const gst = Math.round(itemsTotal * gstRate)
  return {
    itemsTotal,
    deliveryFee,
    platformFee,
    gst,
    total: itemsTotal + deliveryFee + platformFee + gst,
  }
}
