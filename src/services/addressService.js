import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

/** Firestore path: users/{userId}/addresses/{addressId} */

function addressesCollection(userId) {
  return collection(db, 'users', userId, 'addresses')
}

export function subscribeAddresses(userId, onNext, onError) {
  return onSnapshot(
    addressesCollection(userId),
    (snapshot) => {
      const addresses = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      addresses.sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
        return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
      })
      onNext(addresses)
    },
    onError,
  )
}

export async function addAddress(userId, { label, address, phone, isDefault = false }) {
  return addDoc(addressesCollection(userId), {
    label: label.trim(),
    address: address.trim(),
    phone: phone.trim(),
    isDefault: Boolean(isDefault),
    createdAt: serverTimestamp(),
  })
}

export async function updateAddress(userId, addressId, { label, address, phone, isDefault }) {
  return updateDoc(doc(db, 'users', userId, 'addresses', addressId), {
    label: label.trim(),
    address: address.trim(),
    phone: phone.trim(),
    isDefault: Boolean(isDefault),
  })
}

export async function deleteAddress(userId, addressId) {
  return deleteDoc(doc(db, 'users', userId, 'addresses', addressId))
}

/** Ek address ko default banao — baaki sab false (single batch write). */
export async function setDefaultAddress(userId, addresses, addressId) {
  const batch = writeBatch(db)
  addresses.forEach((item) => {
    batch.update(doc(db, 'users', userId, 'addresses', item.id), {
      isDefault: item.id === addressId,
    })
  })
  await batch.commit()
}
