import { createContext } from 'react'

/**
 * Auth state — Google sign-in user, loading flags aur actions.
 * Value shape: { user, isSignedIn, initializing, signingIn, error, signIn, signOut, clearError }
 */
export const AuthContext = createContext(null)
