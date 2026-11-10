import { useCallback, useMemo, useState } from 'react'
import { UIContext } from './uiContext'

export function UIProvider({ children }) {
  const [isCartOpen, setCartOpen] = useState(false)

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  const value = useMemo(
    () => ({ isCartOpen, openCart, closeCart }),
    [isCartOpen, openCart, closeCart],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export default UIProvider
