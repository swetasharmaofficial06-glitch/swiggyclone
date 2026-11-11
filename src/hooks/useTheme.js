import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'foodiehub:theme'
const THEMES = ['light', 'dark']

function readInitialTheme() {
  if (typeof document === 'undefined') return 'dark'
  const attr = document.documentElement.dataset.theme
  return THEMES.includes(attr) ? attr : 'dark'
}

/**
 * Light/dark theme toggle.
 * `<html data-theme="...">` set karta hai aur choice localStorage mein yaad rakhta hai.
 * Pehle paint se pehle theme lagane ke liye index.html mein chhota early script hai.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private mode / storage blocked — theme still works for this session.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0e1014' : '#fc8019')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, isDark: theme === 'dark', toggleTheme }
}

export default useTheme
