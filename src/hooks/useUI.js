import { useContext } from 'react'
import { UIContext } from '../context/uiContext'

export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI() sirf <UIProvider> ke andar use karo.')
  return context
}

export default useUI
