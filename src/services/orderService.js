import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from './firebase'

export const ORDERS_COLLECTION = 'orders'

export const ORDER_STATUS = {
  placed: { label: 'Order placed', emoji: '📝' },
  accepted: { label: 'Accepted', emoji: '👩‍🍳' },
  outForDelivery: { label: 'Out for delivery', emoji: '🚴' },
  delivered: { label: 'Delivered', emoji: '✅' },
  cancelled: { label: 'Cancelled', emoji: '❌' },
}

/** Customer ko dikhne wala normal flow (cancelled alag hai). */
export const ORDER_FLOW = ['placed', 'accepted', 'outForDelivery', 'delivered']

/** Admin dropdown ke options. */
export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, meta]) => ({
  value,
  ...meta,
}))

/**
 * Checkout order ko Firestore mein save karta hai.
 * Login zaroori hai — order `userId` se Google account se link hota hai,
 * aur `firestore.rules` bhi isi ko enforce karta hai.
 */
export async function placeOrder({ customer, items, bill }) {
  const user = auth.currentUser
  if (!user) throw new Error('Order place karne ke liye pehle Google se sign in karo.')

  if (!items?.length) throw new Error('Cart khali hai.')
  if (!bill || bill.total < 0) throw new Error('Bill valid nahi hai.')

  const [first] = items
  const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    userId: user.uid,
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
      payment: customer.payment,
      email: user.email ?? '',
    },
    restaurantId: first.restaurantId,
    restaurantName: first.restaurantName,
    items: items.map(({ itemId, name, price, qty }) => ({ itemId, name, price, qty })),
    itemCount: items.reduce((total, item) => total + item.qty, 0),
    itemsTotal: bill.itemsTotal,
    deliveryFee: bill.deliveryFee,
    platformFee: bill.platformFee,
    gst: bill.gst,
    discount: Number(bill.discount || 0),
    couponCode: bill.couponCode || '',
    subtotal: bill.itemsTotal,
    total: bill.total,
    status: 'placed',
    statusHistory: [{ status: 'placed', at: Timestamp.now() }],
    createdAt: serverTimestamp(),
  })

  return orderRef.id
}

/**
 * Signed-in user ke apne orders — realtime listener.
 * Sorting client-side hai taaki koi composite index banane ki zaroorat na pade.
 */
export function subscribeMyOrders(userId, onNext, onError) {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
  )

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      orders.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      onNext(orders)
    },
    onError,
  )
}

/** Admin ke liye saare orders — newest first. */
export function subscribeAllOrders(onNext, onError) {
  return onSnapshot(
    collection(db, ORDERS_COLLECTION),
    (snapshot) => {
      const orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      orders.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      onNext(orders)
    },
    onError,
  )
}

/**
 * Admin-only: order ka status badlo + timeline ke liye history append karo.
 * `firestore.rules` sirf admin ko ye update deta hai.
 */
export async function updateOrderStatus(orderId, status) {
  if (!ORDER_STATUS[status]) throw new Error('Ye order status valid nahi hai.')

  return updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    status,
    statusHistory: arrayUnion({ status, at: Timestamp.now() }),
  })
}
