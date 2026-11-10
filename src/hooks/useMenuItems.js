import { useEffect, useState } from 'react'
import { watchMenuItems } from '../services/menuService'

/**
 * Ek restaurant ke realtime menu items.
 * State restaurantId ke saath keyed hai taaki switch karte waqt purana menu flash na ho.
 */
export function useMenuItems(restaurantId) {
  const [state, setState] = useState({ id: null, items: [], error: null })

  useEffect(() => {
    if (!restaurantId) return undefined

    const unsubscribe = watchMenuItems(
      restaurantId,
      (items) => setState({ id: restaurantId, items, error: null }),
      (error) => setState({ id: restaurantId, items: [], error }),
    )
    return unsubscribe
  }, [restaurantId])

  const current = state.id === restaurantId

  return {
    items: current ? state.items : [],
    loading: Boolean(restaurantId) && !current,
    error: current ? state.error : null,
  }
}

export default useMenuItems
