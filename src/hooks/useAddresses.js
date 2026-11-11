import { useEffect, useState } from 'react'
import { subscribeAddresses } from '../services/addressService'

/** Signed-in user ke saved addresses (realtime). */
export function useAddresses(userId, enabled = true) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(Boolean(userId) && enabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId || !enabled) {
      setAddresses([])
      setLoading(false)
      setError(null)
      return undefined
    }

    setLoading(true)
    const unsubscribe = subscribeAddresses(
      userId,
      (list) => {
        setAddresses(list)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [userId, enabled])

  return { addresses, loading, error }
}

export default useAddresses
