import { useEffect, useState } from 'react'
import { isNativePlatform, isStandalonePwa } from '../utils/platform'

/**
 * PWA install prompt.
 *
 * - Chrome/Edge/Android: native `beforeinstallprompt` event ko capture karke
 *   apna themed banner dikhate hain (browser ka mini-infobar suppress).
 * - iOS Safari: koi API nahi hai, isliye "Share → Add to Home Screen" hint.
 * - Native app / already installed: kuch nahi dikhta.
 * - Dismiss karne par 14 din tak wapas nahi aata.
 */

const DISMISS_KEY = 'foodiehub:install-dismissed'
const DISMISS_DAYS = 14

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function wasRecentlyDismissed() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0)
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('prompt')

  useEffect(() => {
    if (isNativePlatform() || isStandalonePwa() || wasRecentlyDismissed()) return undefined

    const onBeforeInstall = (event) => {
      event.preventDefault()
      setInstallEvent(event)
      setMode('prompt')
      setVisible(true)
    }

    const onInstalled = () => {
      setVisible(false)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // iOS par install event nahi milta — thodi der baad hint dikhao.
    let iosTimer = 0
    if (isIosDevice()) {
      iosTimer = window.setTimeout(() => {
        setMode('ios')
        setVisible(true)
      }, 2500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      window.clearTimeout(iosTimer)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Storage blocked — sirf is session ke liye hide.
    }
    setVisible(false)
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    setVisible(false)
  }

  return (
    <div className="install-prompt" role="region" aria-label="Install Foodie Hub app">
      <img className="install-prompt__icon" src="/pwa-192x192.png" alt="" width="40" height="40" />
      <div className="install-prompt__text">
        <p className="install-prompt__title">Foodie Hub app install karo</p>
        <p className="install-prompt__sub">
          {mode === 'ios'
            ? 'Share  →  “Add to Home Screen”'
            : 'Fast khulta hai, offline bhi chalta hai.'}
        </p>
      </div>
      {mode === 'prompt' && (
        <button type="button" className="install-prompt__install" onClick={install}>
          Install
        </button>
      )}
      <button
        type="button"
        className="install-prompt__dismiss"
        onClick={dismiss}
        aria-label="Install prompt band karo"
      >
        ✕
      </button>
    </div>
  )
}
