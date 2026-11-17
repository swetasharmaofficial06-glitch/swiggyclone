/**
 * Platform helpers — ek hi codebase web (PWA) aur native (Capacitor) dono par chalta hai.
 *
 * Yahan `@capacitor/core` import nahi karte: native WebView khud `window.Capacitor`
 * inject karta hai, aur web users ko Capacitor ka runtime download nahi karna padta.
 * Native plugins sirf `NativeBridge` (lazy chunk) mein load hote hain.
 */

function nativeBridge() {
  if (typeof window === 'undefined') return undefined
  return window.Capacitor
}

/** `true` jab app Capacitor shell (Android/iOS) ke andar chal raha ho. */
export function isNativePlatform() {
  return nativeBridge()?.isNativePlatform?.() === true
}

/** `'web' | 'android' | 'ios'` */
export function currentPlatform() {
  return nativeBridge()?.getPlatform?.() ?? 'web'
}

/** PWA standalone mode (home screen se khula hua, browser tab nahi). */
export function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  )
}
