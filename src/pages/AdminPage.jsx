import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useRestaurants from '../hooks/useRestaurants'
import useMenuItems from '../hooks/useMenuItems'
import RestaurantForm from '../components/RestaurantForm'
import MenuItemForm from '../components/MenuItemForm'
import Loader from '../components/Loader'
import GoogleIcon from '../components/GoogleIcon'
import { createRestaurant, deleteRestaurant } from '../services/restaurantService'
import { addMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from '../services/menuService'
import { authErrorMessage, changePassword } from '../services/authService'
import { SAMPLE_RESTAURANTS } from '../data/sampleData'

export default function AdminPage() {
  const {
    user,
    initializing,
    signingIn,
    isAdmin,
    checkingAdmin,
    refreshAdminStatus,
    signIn,
    signInWithEmail,
  } = useAuth()
  const { restaurants, loading } = useRestaurants()
  const [selectedId, setSelectedId] = useState('')
  const [seedStatus, setSeedStatus] = useState(null)
  const [seeding, setSeeding] = useState(false)

  // Admin email/password login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)

  // Password change form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [changingPassword, setChangingPassword] = useState(false)

  /** Signed-in user ke liye ek baar fresh claim check (grant ke turant baad bhi kaam kare). */
  const checkedClaim = useRef(false)
  const [claimChecked, setClaimChecked] = useState(false)
  const currentUid = user?.uid ?? null

  useEffect(() => {
    checkedClaim.current = false
    setClaimChecked(false)
  }, [currentUid])

  useEffect(() => {
    if (!user) return
    if (isAdmin) {
      setClaimChecked(true)
      return
    }
    if (checkedClaim.current) return
    checkedClaim.current = true
    refreshAdminStatus().finally(() => setClaimChecked(true))
  }, [user, isAdmin, refreshAdminStatus])

  const selected = restaurants.find((restaurant) => restaurant.id === selectedId) ?? null

  async function handleDeleteRestaurant(id, name) {
    if (!window.confirm(`"${name}" delete karna hai? Uska menu bhi delete hoga.`)) return
    try {
      const menu = await getMenuItems(id)
      await Promise.all(menu.map((item) => deleteMenuItem(id, item.id)))
      await deleteRestaurant(id)
      if (selectedId === id) setSelectedId('')
    } catch (err) {
      window.alert(`Delete nahi hua: ${err.message}`)
    }
  }

  async function seedSampleData() {
    if (!window.confirm(`${SAMPLE_RESTAURANTS.length} sample restaurants + menus load karein?`)) return
    setSeeding(true)
    setSeedStatus(`Seeding… 0/${SAMPLE_RESTAURANTS.length}`)
    try {
      for (let index = 0; index < SAMPLE_RESTAURANTS.length; index += 1) {
        const sample = SAMPLE_RESTAURANTS[index]
        const { menu, ...restaurantData } = sample
        // Sequential isliye taaki progress sahi dikhe aur rate-limit na lage.
        // eslint-disable-next-line no-await-in-loop
        const docRef = await createRestaurant(restaurantData)
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(menu.map((item) => addMenuItem(docRef.id, item)))
        setSeedStatus(`Seeding… ${index + 1}/${SAMPLE_RESTAURANTS.length}`)
      }
      setSeedStatus('Done! ✅ Home page pe restaurants aa gaye.')
    } catch (err) {
      setSeedStatus(`Error: ${err.message}`)
    } finally {
      setSeeding(false)
    }
  }

  async function handleAdminLogin(event) {
    event.preventDefault()
    setLoginError(null)

    if (!email.trim()) {
      setLoginError('Admin email daalo.')
      return
    }
    if (password.length < 6) {
      setLoginError('Password kam se kam 6 characters ka hona chahiye.')
      return
    }

    try {
      await signInWithEmail(email.trim(), password)
      setPassword('')
    } catch (err) {
      setLoginError(authErrorMessage(err))
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Naya password kam se kam 6 characters ka hona chahiye.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Dono passwords match nahi kar rahe.' })
      return
    }

    setChangingPassword(true)
    try {
      await changePassword(newPassword)
      setPasswordMsg({ type: 'success', text: 'Password update ho gaya ✅' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMsg({ type: 'error', text: authErrorMessage(err) })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <main className="page admin-page">
      {initializing || (user && !isAdmin && !claimChecked) ? (
        <Loader label="Account check ho raha hai…" />
      ) : !user ? (
        <div className="access-gate">
          <div className="access-gate__emoji">🔐</div>
          <h1>Admin login</h1>
          <p className="muted-text">
            Admin panel ke liye email aur password se sign in karo.
          </p>

          <form className="admin-login" onSubmit={handleAdminLogin}>
            <div className="form-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {loginError ? <p className="form-msg form-msg--error">{loginError}</p> : null}

            <button type="submit" className="btn btn--primary btn--block" disabled={signingIn}>
              {signingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="admin-login__divider">
            <span>ya</span>
          </div>

          <button type="button" className="btn btn--outline" onClick={signIn} disabled={signingIn}>
            <GoogleIcon size={18} />
            <span>Continue with Google</span>
          </button>

          <Link to="/" className="btn btn--ghost">
            ← Back to home
          </Link>

          <p className="access-gate__note">
            Sirf admin claim wale account ko access milega (`admin: true`).
          </p>
        </div>
      ) : !isAdmin ? (
        <div className="access-gate">
          <div className="access-gate__emoji">🚫</div>
          <h1>Access nahi hai</h1>
          <p className="muted-text">
            <strong>{user.email}</strong> ke paas admin permission nahi hai. Sirf admin claim wale
            account hi restaurants/menu manage kar sakte hain.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={refreshAdminStatus}
            disabled={checkingAdmin}
          >
            {checkingAdmin ? 'Checking…' : '🔄 Access dobara check karo'}
          </button>
          <Link to="/" className="btn btn--outline">
            ← Back to home
          </Link>
          <p className="access-gate__note">
            Admin banao: <code>npm run admin:grant -- email@example.com</code> (detail README
            mein). Grant ke baad ye button dabao — token refresh ho jayega.
          </p>
        </div>
      ) : (
        <>
          <header className="admin-page__header">
            <div>
              <h1>Admin Panel 👩‍🍳</h1>
              <p className="muted-text">
                Restaurants aur menu items manage karo — sirf admin access wale account se.
              </p>
              <p className="admin-page__badge">🔑 Admin · {user.displayName || user.email}</p>
            </div>
            <button
              type="button"
              className="btn btn--outline"
              onClick={seedSampleData}
              disabled={seeding}
            >
              {seeding ? 'Seeding…' : 'Load sample data'}
            </button>
          </header>
          {seedStatus ? <p className="admin-page__seed-status">{seedStatus}</p> : null}

          <div className="admin-layout">
            <section className="admin-section">
              <h2>+ Naya restaurant</h2>
              <RestaurantForm />
            </section>

            <section className="admin-section">
              <h2>🍴 Menu manage karo</h2>
              {loading ? (
                <Loader />
              ) : restaurants.length === 0 ? (
                <p className="admin-section__note">
                  Pehle restaurant add karo (ya "Load sample data" dabao), phir yahan menu add hoga.
                </p>
              ) : (
                <>
                  <div className="form-field">
                    <label htmlFor="admin-restaurant-select">Restaurant select karo</label>
                    <select
                      id="admin-restaurant-select"
                      value={selectedId}
                      onChange={(event) => setSelectedId(event.target.value)}
                    >
                      <option value="">— Choose —</option>
                      {restaurants.map((restaurant) => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selected ? (
                    <>
                      <MenuItemForm restaurantId={selected.id} restaurantName={selected.name} />
                      <MenuManager restaurantId={selected.id} restaurantName={selected.name} />
                    </>
                  ) : (
                    <p className="admin-section__note">Restaurant select karo menu manage karne ke liye.</p>
                  )}
                </>
              )}
            </section>

            <section className="admin-section">
              <h2>📋 All restaurants ({restaurants.length})</h2>
              {loading ? (
                <Loader />
              ) : (
                <ul className="admin-restaurant-list">
                  {restaurants.map((restaurant) => (
                    <li key={restaurant.id} className="admin-restaurant-row">
                      <div className="admin-restaurant-row__info">
                        <strong>{restaurant.name}</strong>
                        <span>
                          {' '}· ★ {Number(restaurant.rating || 0).toFixed(1)} · {restaurant.location}
                        </span>
                      </div>
                      <div className="admin-restaurant-row__actions">
                        <Link to={`/restaurant/${restaurant.id}`} className="btn btn--ghost btn--small">
                          View
                        </Link>
                        <button
                          type="button"
                          className="btn btn--danger btn--small"
                          onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-section admin-section--wide">
              <h2>🔑 Admin password badlo</h2>
              <p className="admin-section__note">
                Signed in: <strong>{user.email}</strong>. Password kam se kam 6 characters ka
                rakho — isi se admin panel mein login hoga.
              </p>
              <form className="password-form" onSubmit={handlePasswordChange}>
                <div className="form-field">
                  <label htmlFor="admin-new-password">Naya password</label>
                  <input
                    id="admin-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Kam se kam 6 characters"
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="admin-confirm-password">Confirm password</label>
                  <input
                    id="admin-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Dobara wahi password"
                    required
                    minLength={6}
                  />
                </div>

                {passwordMsg ? (
                  <p className={`form-msg form-msg--${passwordMsg.type === 'error' ? 'error' : 'success'}`}>
                    {passwordMsg.text}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="btn btn--outline"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </section>
          </div>
        </>
      )}
    </main>
  )
}

function MenuManager({ restaurantId, restaurantName }) {
  const { items, loading } = useMenuItems(restaurantId)
  const [busyId, setBusyId] = useState(null)

  async function toggleBestseller(item) {
    setBusyId(item.id)
    try {
      await updateMenuItem(restaurantId, item.id, { isBestseller: !item.isBestseller })
    } catch (err) {
      window.alert(`Bestseller update nahi hua: ${err.message}`)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Loader label="Menu load ho raha hai…" />
  if (items.length === 0) {
    return <p className="admin-section__note">{restaurantName} ka menu abhi khali hai.</p>
  }

  return (
    <ul className="admin-menu-list">
      {items.map((item) => (
        <li key={item.id} className="admin-menu-row">
          <div>
            <strong>
              {item.isBestseller ? '⭐ ' : ''}
              {item.name}
            </strong>
            <span>
              {' '}· ₹{item.price} · {item.category} · {item.isVeg ? '🌱 veg' : '🍗 non-veg'}
              {Number(item.soldCount || 0) > 0 ? ` · 🔥 ${item.soldCount} sold` : ''}
            </span>
          </div>
          <div className="admin-menu-row__actions">
            <button
              type="button"
              className={`btn btn--small ${item.isBestseller ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => toggleBestseller(item)}
              disabled={busyId === item.id}
              title="Home page ke 'Most Sold Items' section mein dikhao"
            >
              {busyId === item.id ? 'Saving…' : item.isBestseller ? '★ Bestseller' : '☆ Bestseller'}
            </button>
            <button
              type="button"
              className="btn btn--danger btn--small"
              onClick={() => {
                if (window.confirm(`"${item.name}" delete karna hai?`)) {
                  deleteMenuItem(restaurantId, item.id)
                }
              }}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
