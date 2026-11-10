export function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
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
