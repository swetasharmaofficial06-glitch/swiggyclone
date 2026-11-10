import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

/** restaurants collection ke saare Firestore calls — components direct Firestore use nahi karte. */

export const RESTAURANTS_COLLECTION = 'restaurants'

export const restaurantsRef = collection(db, RESTAURANTS_COLLECTION)

/** Realtime listener — unsubscribe function return karta hai. */
export function watchRestaurants(onNext, onError) {
  return onSnapshot(
    restaurantsRef,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export async function getRestaurant(id) {
  const snapshot = await getDoc(doc(db, RESTAURANTS_COLLECTION, id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export async function createRestaurant(data) {
  return addDoc(restaurantsRef, {
    createdAt: serverTimestamp(),
    ...data,
  })
}

export async function updateRestaurant(id, data) {
  return updateDoc(doc(db, RESTAURANTS_COLLECTION, id), data)
}

export async function deleteRestaurant(id) {
  return deleteDoc(doc(db, RESTAURANTS_COLLECTION, id))
}
