import { useEffect, useState } from 'react'
import { getRestaurant } from '../services/restaurantService'

/**
 * Ek restaurant ka data. State `id` ke saath keyed hai — route change par
 * purana data flash nahi hota aur effect mein sync setState nahi hota.
 */
export function useRestaurant(id) {
  const [state, setState] = useState({ id: null, restaurant: null, error: null })

  useEffect(() => {
    if (!id) return undefined
    let cancelled = false

    getRestaurant(id)
      .then((data) => {
        if (!cancelled) setState({ id, restaurant: data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ id, restaurant: null, error: err })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const current = state.id === id

  return {
    restaurant: current ? state.restaurant : null,
    loading: Boolean(id) && !current,
    error: current ? state.error : null,
  }
}

export default useRestaurant
