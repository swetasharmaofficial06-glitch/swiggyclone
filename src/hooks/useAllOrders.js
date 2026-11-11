import { useEffect, useState } from 'react'
import { subscribeAllOrders } from '../services/orderService'

/**
 * Admin panel ke liye saare orders (realtime).
 * `enabled` false hone par kuch subscribe nahi hota (admin check ke pehle).
 */
export function useAllOrders(enabled = true) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setOrders([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const unsubscribe = subscribeAllOrders(
      (list) => {
        setOrders(list)
        setError(null)
        setLoading(false)
      },
      (err) => {
        console.error('Orders load failed:', err)
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [enabled])

  return { orders, loading, error }
}

export default useAllOrders
