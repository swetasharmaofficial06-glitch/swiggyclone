import { useContext } from 'react'
import { CartContext } from '../context/cartContext'

/** Cart state + actions. Sirf <CartProvider> ke andar use karo. */
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart() sirf <CartProvider> ke andar use karo.')
  return context
}

export default useCart
