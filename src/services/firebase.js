import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase initialization — config `.env` se aata hai, code mein hardcoded nahi.
 * Client SDK config public hota hai; asli security Firestore RULES se aati hai.
 *
 * Note: Firebase Storage use nahi ho raha — images `public/images/` mein bundled hain.
 */

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missing = ENV_KEYS.filter((key) => !import.meta.env[key])

if (missing.length > 0) {
  throw new Error(
    `Firebase config incomplete. Ye .env variables missing hain: ${missing.join(', ')}.\n` +
      `.env.example copy karke .env banao aur Firebase Console → Project Settings → Your apps se values lo.`,
  )
}

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
