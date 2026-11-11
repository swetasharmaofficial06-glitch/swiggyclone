import { useEffect, useState } from 'react'
import { collectionGroup, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'

/**
 * Home page ka "Most Sold Items" section.
 * Admin panel se `isBestseller: true` mark kiye gaye menu items (saare restaurants se),
 * soldCount ke hisaab se sorted.
 */
export function useBestsellers(limit = 10) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const bestsellersQuery = query(
      collectionGroup(db, 'menu'),
      where('isBestseller', '==', true),
    )

    const unsubscribe = onSnapshot(
      bestsellersQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            restaurantId: docSnap.ref.parent.parent?.id ?? null,
            ...docSnap.data(),
          }))
          .filter((item) => item.restaurantId)

        list.sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0))
        setItems(list.slice(0, limit))
        setError(null)
        setLoading(false)
      },
      (err) => {
        // Index missing / rules block — Home par section chhup jaata hai, error console mein.
        console.error('Bestsellers load failed:', err)
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [limit])

  return { items, loading, error }
}

export default useBestsellers
