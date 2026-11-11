export const CUISINES = [
  'All',
  'Biryani',
  'North Indian',
  'South Indian',
  'Chinese',
  'Pizza',
  'Burger',
  'Pasta',
  'Momos',
  'Kebab',
  'Seafood',
  'Salads',
  'Breakfast',
  'Snacks',
  'Desserts',
  'Ice Cream',
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating: High to Low' },
  { value: 'deliveryTime', label: 'Delivery Time' },
  { value: 'costLow', label: 'Cost: Low to High' },
  { value: 'costHigh', label: 'Cost: High to Low' },
]

/** Cart bill — Swiggy jaisa breakdown */
export const FEES = {
  delivery: 30,
  platform: 5,
  gstRate: 0.05,
  freeDeliveryAbove: 499,
}

export const PLACEHOLDER_EMOJIS = ['🍛', '🍕', '🍔', '🍜', '🥗', '🍰', '☕', '🥘']

/**
 * Fixed coupon codes (admin panel se manage nahi hote).
 * Discount sirf checkout par client-side calculate hota hai — demo app hai,
 * real payment gateway nahi juda.
 */
export const COUPONS = {
  WELCOME50: {
    code: 'WELCOME50',
    label: '50% off up to ₹100',
    type: 'percent',
    value: 50,
    maxDiscount: 100,
    minOrder: 199,
  },
  FREEDEL: {
    code: 'FREEDEL',
    label: 'Free delivery',
    type: 'freeDelivery',
    minOrder: 299,
  },
  FLAT50: {
    code: 'FLAT50',
    label: '₹50 off',
    type: 'flat',
    value: 50,
    minOrder: 399,
  },
}

/** Saved addresses per user (Firestore: users/{uid}/addresses). */
export const MAX_ADDRESSES = 5
export const ADDRESS_LABELS = ['Home', 'Work', 'Other']
