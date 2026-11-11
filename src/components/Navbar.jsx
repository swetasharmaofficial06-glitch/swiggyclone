import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import useUI from '../hooks/useUI'
import { cx } from '../utils/format'
import GoogleIcon from './GoogleIcon'
import UserAvatar from './UserAvatar'

export default function Navbar() {
  const cart = useCart()
  const { openCart } = useUI()
  const { user, initializing, signingIn, error, signIn, signOut, clearError } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  /** Avatar menu: bahar click ya Escape pe band. */
  useEffect(() => {
    if (!menuOpen) return undefined

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="Foodie Hub home">
          <span className="navbar__logo-mark">foodie</span>
          <span className="navbar__logo-tag">hub</span>
        </Link>

        <button type="button" className="navbar__location" title="Delivery location (demo)">
          <span className="navbar__location-label">OTHER</span>
          <span className="navbar__location-city">Bengaluru, Karnataka ▾</span>
        </button>

        <nav className="navbar__links" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Restaurants
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
          <button
            type="button"
            className={cx('navbar__cart', cart.count > 0 && 'navbar__cart--active')}
            onClick={openCart}
            aria-label={`Cart, ${cart.count} items`}
          >
            <span aria-hidden="true">🛒</span>
            <span className="navbar__cart-text">Cart</span>
            {cart.count > 0 ? <span className="navbar__cart-badge">{cart.count}</span> : null}
          </button>

          {initializing ? (
            <span className="navbar__auth-loading" aria-hidden="true" />
          ) : user ? (
            <div className="navbar__user" ref={menuRef}>
              <button
                type="button"
                className="navbar__user-btn"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                <UserAvatar user={user} />
                <span className="navbar__user-name">{firstName(user)}</span>
                <span className="navbar__user-caret" aria-hidden="true">
                  ▾
                </span>
              </button>

              {menuOpen ? (
                <div className="navbar__menu" role="menu">
                  <div className="navbar__menu-head">
                    <UserAvatar user={user} size="lg" />
                    <div>
                      <p className="navbar__menu-name">{user.displayName || 'Google user'}</p>
                      <p className="navbar__menu-email">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/orders"
                    className="navbar__menu-item navbar__menu-item--link"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    📦 My orders
                  </Link>
                  <button
                    type="button"
                    className="navbar__menu-item"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="navbar__signin"
              onClick={signIn}
              disabled={signingIn}
            >
              <GoogleIcon size={16} />
              <span>{signingIn ? 'Signing in…' : 'Sign in'}</span>
            </button>
          )}
        </nav>
      </div>

      {error ? (
        <div className="auth-toast" role="alert">
          <span>{error}</span>
          <button type="button" className="auth-toast__close" onClick={clearError} aria-label="Dismiss message">
            ✕
          </button>
        </div>
      ) : null}
    </header>
  )
}

const navLinkClass = ({ isActive }) => cx('navbar__link', isActive && 'navbar__link--active')

function firstName(user) {
  const name = user.displayName?.trim()
  if (!name) return 'Account'
  return name.split(/\s+/)[0]
}
