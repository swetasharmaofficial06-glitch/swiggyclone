import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/** Har restaurant ka sub-collection: restaurants/{id}/menu */

export const MENU_COLLECTION = 'menu'

export async function addMenuItem(restaurantId, data) {
  return addDoc(collection(db, 'restaurants', restaurantId, MENU_COLLECTION), {
    createdAt: serverTimestamp(),
    ...data,
  })
}

export async function getMenuItems(restaurantId) {
  const snapshot = await getDocs(collection(db, 'restaurants', restaurantId, MENU_COLLECTION))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteMenuItem(restaurantId, menuItemId) {
  return deleteDoc(doc(db, 'restaurants', restaurantId, MENU_COLLECTION, menuItemId))
}

export function watchMenuItems(restaurantId, onNext, onError) {
  return onSnapshot(
    collection(db, 'restaurants', restaurantId, MENU_COLLECTION),
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}
