import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useAddresses from '../hooks/useAddresses'
import {
  addAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from '../services/addressService'
import { ADDRESS_LABELS, MAX_ADDRESSES } from '../constants'
import GoogleIcon from '../components/GoogleIcon'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'

const EMPTY_FORM = { label: 'Home', address: '', phone: '', isDefault: false }
const PHONE_REGEX = /^[6-9]\d{9}$/

export default function AddressesPage() {
  const { user, initializing, signingIn, signIn } = useAuth()
  const { addresses, loading, error } = useAddresses(user?.uid, Boolean(user))
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [formError, setFormError] = useState(null)

  const atLimit = addresses.length >= MAX_ADDRESSES && !editingId

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError(null)
  }

  function startEdit(address) {
    setEditingId(address.id)
    setForm({
      label: address.label ?? 'Home',
      address: address.address ?? '',
      phone: address.phone ?? '',
      isDefault: Boolean(address.isDefault),
    })
    setFormError(null)
    setMessage(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setMessage(null)

    const phone = form.phone.replace(/\D/g, '')
    if (!form.label.trim()) {
      setFormError('Label daalo (Home / Work / Other).')
      return
    }
    if (form.address.trim().length < 10) {
      setFormError('Address thoda detail mein likho (kam se kam 10 characters).')
      return
    }
    if (!PHONE_REGEX.test(phone)) {
      setFormError('Valid 10-digit Indian mobile number daalo.')
      return
    }
    if (!editingId && addresses.length >= MAX_ADDRESSES) {
      setFormError(`Max ${MAX_ADDRESSES} addresses save kar sakte ho — pehle ek delete karo.`)
      return
    }

    setBusy(true)
    try {
      const payload = {
        label: form.label.trim(),
        address: form.address.trim(),
        phone,
        isDefault: form.isDefault,
      }

      if (editingId) {
        await updateAddress(user.uid, editingId, payload)
        setMessage('Address update ho gaya ✅')
      } else {
        await addAddress(user.uid, payload)
        setMessage('Naya address save ho gaya ✅')
      }
      resetForm()
    } catch (err) {
      setFormError(err.message ?? 'Address save nahi hua. Dobara try karo.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(address) {
    if (!window.confirm(`"${address.label}" address delete karna hai?`)) return
    setBusy(true)
    setMessage(null)
    try {
      await deleteAddress(user.uid, address.id)
      if (editingId === address.id) resetForm()
      setMessage('Address delete ho gaya.')
    } catch (err) {
      setFormError(err.message ?? 'Delete nahi hua.')
    } finally {
      setBusy(false)
    }
  }

  async function makeDefault(address) {
    setBusy(true)
    setMessage(null)
    try {
      await setDefaultAddress(user.uid, addresses, address.id)
      setMessage(`"${address.label}" ab default address hai ✅`)
    } catch (err) {
      setFormError(err.message ?? 'Default set nahi hua.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page addresses-page">
      <header className="orders-page__header">
        <div>
          <h1>Saved Addresses 📍</h1>
          <p className="muted-text">
            {user
              ? `${addresses.length}/${MAX_ADDRESSES} addresses saved · checkout par ek click mein select ho jayega.`
              : 'Apne addresses save karne ke liye Google se sign in karo.'}
          </p>
        </div>
        <Link to="/" className="btn btn--outline btn--small">
          ← Browse restaurants
        </Link>
      </header>

      {initializing ? (
        <Loader label="Account check ho raha hai…" />
      ) : !user ? (
        <div className="access-gate">
          <div className="access-gate__emoji">🔐</div>
          <h2>Sign in karke addresses save karo</h2>
          <p className="muted-text">
            Addresses aapke Google account se linked hote hain — sirf aap hi dekh sakte ho.
          </p>
          <button type="button" className="btn btn--primary" onClick={signIn} disabled={signingIn}>
            <GoogleIcon size={18} />
            <span>{signingIn ? 'Signing in…' : 'Continue with Google'}</span>
          </button>
        </div>
      ) : (
        <div className="addresses-layout">
          <section className="address-form-card">
            <h2>{editingId ? '✏️ Address edit karo' : '➕ Naya address'}</h2>

            <form className="address-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="address-label">Label</label>
                <div className="address-label-row">
                  {ADDRESS_LABELS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={`chip ${form.label === label ? 'chip--active' : ''}`}
                      onClick={() => update('label', label)}
                    >
                      {label === 'Home' ? '🏠' : label === 'Work' ? '🏢' : '📍'} {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="address-line">Poora address *</label>
                <textarea
                  id="address-line"
                  rows={3}
                  value={form.address}
                  onChange={(event) => update('address', event.target.value)}
                  placeholder="Flat / house no., building, street, area, city"
                />
              </div>

              <div className="form-field">
                <label htmlFor="address-phone">Mobile number *</label>
                <input
                  id="address-phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  placeholder="9876543210"
                />
              </div>

              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => update('isDefault', event.target.checked)}
                />
                Default address banao
              </label>

              {formError ? <p className="form-msg form-msg--error">{formError}</p> : null}
              {message ? <p className="form-msg form-msg--success">{message}</p> : null}
              {atLimit ? (
                <p className="form-msg form-msg--error">
                  {MAX_ADDRESSES} addresses full hain — naya add karne ke liye pehle ek delete karo.
                </p>
              ) : null}

              <div className="address-form__actions">
                {editingId ? (
                  <button type="button" className="btn btn--ghost" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={busy || atLimit}
                >
                  {busy ? 'Saving…' : editingId ? 'Update address' : 'Save address'}
                </button>
              </div>
            </form>
          </section>

          <section className="address-list-card">
            <h2>📚 Aapke addresses</h2>

            {loading ? (
              <Loader label="Addresses load ho rahe hain…" />
            ) : error ? (
              <EmptyState
                emoji="🚨"
                title="Addresses load nahi hue"
                hint={error.message ?? 'Page refresh karke dobara try karo.'}
              />
            ) : addresses.length === 0 ? (
              <p className="admin-section__note">
                Abhi koi address save nahi hai — left form se pehla address add karo.
              </p>
            ) : (
              <ul className="address-list">
                {addresses.map((address) => (
                  <li key={address.id} className="address-card">
                    <div className="address-card__head">
                      <strong>
                        {address.label === 'Home' ? '🏠' : address.label === 'Work' ? '🏢' : '📍'}{' '}
                        {address.label}
                      </strong>
                      {address.isDefault ? (
                        <span className="address-card__default">Default</span>
                      ) : null}
                    </div>
                    <p className="address-card__line">{address.address}</p>
                    <p className="address-card__phone">☎ {address.phone}</p>
                    <div className="address-card__actions">
                      {!address.isDefault ? (
                        <button
                          type="button"
                          className="btn btn--outline btn--small"
                          onClick={() => makeDefault(address)}
                          disabled={busy}
                        >
                          Set default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => startEdit(address)}
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => handleDelete(address)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
