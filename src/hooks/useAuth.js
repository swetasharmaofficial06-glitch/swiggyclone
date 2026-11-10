import { useContext } from 'react'
import { AuthContext } from '../context/authContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth() sirf <AuthProvider> ke andar use karo.')
  return context
}

export default useAuth
