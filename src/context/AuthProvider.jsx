import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import {
  authErrorMessage,
  signInWithEmail as firebaseSignInWithEmail,
  signInWithGoogle,
  signOutUser,
  watchAuth,
} from '../services/authService'
import { auth } from '../services/firebase'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(false)
  const [error, setError] = useState(null)

  /** Page load pe Firebase session restore karta hai (agar pehle login tha). */
  useEffect(() => {
    let active = true
    const unsubscribe = watchAuth((nextUser) => {
      if (!active) return
      setUser(nextUser)
      setInitializing(false)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  /** Admin claim token se padho (cached token — fresh check ke liye refreshAdminStatus). */
  useEffect(() => {
    let active = true

    if (!user) {
      setIsAdmin(false)
      return () => {
        active = false
      }
    }

    user
      .getIdTokenResult()
      .then((result) => {
        if (active) setIsAdmin(result.claims.admin === true)
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })

    return () => {
      active = false
    }
  }, [user])

  /**
   * Claim abhi-abhi grant hua ho toh cached token mein nahi hota.
   * Ye force-refresh karke admin status dobara check karta hai.
   */
  const refreshAdminStatus = useCallback(async () => {
    const current = auth.currentUser
    if (!current) {
      setIsAdmin(false)
      return false
    }

    setCheckingAdmin(true)
    try {
      const result = await current.getIdTokenResult(true)
      const admin = result.claims.admin === true
      setIsAdmin(admin)
      return admin
    } catch {
      return false
    } finally {
      setCheckingAdmin(false)
    }
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    setSigningIn(true)
    try {
      const signedInUser = await signInWithGoogle()
      if (signedInUser) setUser(signedInUser)
      return signedInUser
    } catch (err) {
      setError(authErrorMessage(err))
      return null
    } finally {
      setSigningIn(false)
    }
  }, [])

  /**
   * Admin panel ka email/password sign-in. Error yahan catch nahi hota —
   * AdminPage form mein message dikhata hai.
   */
  const signInWithEmail = useCallback(async (email, password) => {
    setError(null)
    setSigningIn(true)
    try {
      const signedInUser = await firebaseSignInWithEmail(email, password)
      setUser(signedInUser)
      return signedInUser
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    try {
      await signOutUser()
      setUser(null)
      setIsAdmin(false)
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      user,
      isSignedIn: Boolean(user),
      initializing,
      signingIn,
      isAdmin,
      checkingAdmin,
      error,
      signIn,
      signInWithEmail,
      signOut,
      clearError,
      refreshAdminStatus,
    }),
    [
      user,
      initializing,
      signingIn,
      isAdmin,
      checkingAdmin,
      error,
      signIn,
      signInWithEmail,
      signOut,
      clearError,
      refreshAdminStatus,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
