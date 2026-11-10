import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth'
import { auth } from './firebase'

/**
 * Firebase Auth wrapper — Google popup (customers) + email/password (admin panel).
 * Order place karne ke liye login zaroori hai (see `orderService.js` + `firestore.rules`).
 */

const googleProvider = new GoogleAuthProvider()
// Har baar account chooser dikhao — shared device pe galti se purana account na chale.
googleProvider.setCustomParameters({ prompt: 'select_account' })

/** Common Firebase Auth errors ke friendly Hinglish messages. */
const ERROR_MESSAGES = {
  'auth/popup-closed-by-user': 'Sign-in window band ho gaya. Dobara try karo.',
  'auth/cancelled-popup-request': 'Sign-in cancel ho gaya.',
  'auth/popup-blocked': 'Browser ne popup block kiya. Popup allow karke dobara try karo.',
  'auth/network-request-failed': 'Internet connection check karo, phir dobara try karo.',
  'auth/unauthorized-domain': 'Ye website Firebase Auth mein authorized nahi hai.',
  'auth/operation-not-allowed': 'Ye sign-in method Firebase project mein enabled nahi hai.',
  'auth/account-exists-with-different-credential':
    'Is email se pehle koi doosra login method use hua hai.',
  'auth/internal-error': 'Google se connect nahi ho paya. Dobara try karo.',
  'auth/invalid-email': 'Email sahi format mein likho.',
  'auth/missing-password': 'Password daalo.',
  'auth/invalid-credential': 'Email ya password galat hai.',
  'auth/wrong-password': 'Password galat hai.',
  'auth/user-not-found': 'Is email se koi account nahi mila.',
  'auth/too-many-requests': 'Bahut zyada attempts ho gaye — thodi der baad try karo.',
  'auth/weak-password': 'Password kam se kam 6 characters ka hona chahiye.',
  'auth/requires-recent-login': 'Security ke liye dobara sign in karo, phir try karo.',
  'auth/user-disabled': 'Ye account disable kar diya gaya hai.',
}

export function authErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? error?.message ?? 'Sign-in nahi hua. Dobara try karo.'
}

/** Google popup kholta hai. Cancel karne pe `null` return karta hai (error throw nahi). */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null
    }
    throw error
  }
}

/** Admin panel ka email/password sign-in. Galat credentials pe error throw karta hai. */
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password)
  return result.user
}

export async function signOutUser() {
  await signOut(auth)
}

/** Signed-in user ka password badalta hai (recent login zaroori hai). */
export async function changePassword(newPassword) {
  const user = auth.currentUser
  if (!user) throw new Error('Pehle sign in karo.')
  await updatePassword(user, newPassword)
}

/** Auth state listen karta hai; unsubscribe function return karta hai. */
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback)
}
