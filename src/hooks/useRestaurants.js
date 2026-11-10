import { useEffect, useState } from 'react'
import { watchRestaurants } from '../services/restaurantService'

/**
 * Realtime restaurant list (onSnapshot). Unmount pe listener cleanup.
 * Filtering/sorting page karta hai — hook sirf data source hai.
 */
export function useRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = watchRestaurants(
      (list) => {
        setRestaurants(list)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  return { restaurants, loading, error }
}

export default useRestaurants
