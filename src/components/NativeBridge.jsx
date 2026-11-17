import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import useUI from '../hooks/useUI'
import { isNativePlatform } from '../utils/platform'

/**
 * Native (Capacitor) shell ke liye bridge — web par ye component kuch nahi karta.
 *
 * - Splash screen hide
 * - Status bar theme (light/dark toggle ke saath sync)
 * - Android hardware back button: drawer → previous page → double-back to exit
 * - Deep links (`appUrlOpen`) → React Router route
 * - External links system browser mein khulein
 */

const EXIT_HINT_ID = 'native-exit-hint'
const STATUS_BAR_COLOR = { dark: '#0e1014', light: '#fc8019' }

let exitHintTimer = 0

function applyStatusBarTheme() {
  const isDark = document.documentElement.dataset.theme !== 'light'
  return Promise.allSettled([
    StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark }),
    StatusBar.setBackgroundColor({ color: isDark ? STATUS_BAR_COLOR.dark : STATUS_BAR_COLOR.light }),
  ])
}

function showExitHint() {
  let hint = document.getElementById(EXIT_HINT_ID)
  if (!hint) {
    hint = document.createElement('div')
    hint.id = EXIT_HINT_ID
    hint.className = 'native-hint'
    hint.setAttribute('role', 'status')
    hint.textContent = 'App band karne ke liye phir back dabao'
    document.body.appendChild(hint)
  }

  // Agli paint par class lagao, taaki transition chale.
  requestAnimationFrame(() => hint?.classList.add('native-hint--visible'))
  window.clearTimeout(exitHintTimer)
  exitHintTimer = window.setTimeout(() => {
    hint?.classList.remove('native-hint--visible')
  }, 1800)
}

export default function NativeBridge() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isCartOpen, closeCart } = useUI()

  const pathnameRef = useRef(location.pathname)
  const uiRef = useRef({ isCartOpen, closeCart })

  useEffect(() => {
    pathnameRef.current = location.pathname
  }, [location.pathname])

  useEffect(() => {
    uiRef.current = { isCartOpen, closeCart }
  }, [isCartOpen, closeCart])

  useEffect(() => {
    if (!isNativePlatform()) return undefined

    let disposed = false
    const handles = []
    let lastBackPress = 0

    const setup = async () => {
      await Promise.allSettled([SplashScreen.hide({ fadeOutDuration: 200 })])
      if (disposed) return
      await applyStatusBarTheme()
      if (disposed) return

      handles.push(
        await CapacitorApp.addListener('backButton', () => {
          const { isCartOpen: cartOpen, closeCart: close } = uiRef.current
          if (cartOpen) {
            close()
            return
          }

          const historyIndex = window.history.state?.idx
          const canGoBack =
            typeof historyIndex === 'number' ? historyIndex > 0 : pathnameRef.current !== '/'

          if (canGoBack) {
            navigate(-1)
            return
          }

          const now = Date.now()
          if (now - lastBackPress < 2000) {
            CapacitorApp.exitApp()
            return
          }
          lastBackPress = now
          showExitHint()
        }),
      )

      handles.push(
        await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
          try {
            const target = new URL(url)
            const path = `${target.pathname}${target.search}${target.hash}`
            if (path && path !== '/') navigate(path)
          } catch {
            // Malformed deep link — ignore.
          }
        }),
      )
    }

    setup()

    /** Theme badalne par status bar icons/background update karo. */
    const themeObserver = new MutationObserver(() => {
      applyStatusBarTheme()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    /** `target="_blank"` / external http(s) links system browser mein kholo. */
    const onDocumentClick = (event) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a[href]')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')) return

      let url
      try {
        url = new URL(anchor.href)
      } catch {
        return
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return

      const isExternal = url.origin !== window.location.origin
      if (!isExternal && anchor.target !== '_blank') return

      event.preventDefault()
      Browser.open({ url: url.href })
    }
    document.addEventListener('click', onDocumentClick, true)

    return () => {
      disposed = true
      themeObserver.disconnect()
      document.removeEventListener('click', onDocumentClick, true)
      handles.forEach((handle) => handle.remove())
      window.clearTimeout(exitHintTimer)
    }
  }, [navigate])

  return null
}
