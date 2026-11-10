import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Route change pe page top se shuru ho (SPA behaviour). */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
