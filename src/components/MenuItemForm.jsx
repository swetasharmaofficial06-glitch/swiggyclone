import { useState } from 'react'
import ImagePicker from './ImagePicker'
import { addMenuItem } from '../services/menuService'
import { MENU_IMAGES } from '../data/sampleImages'

const EMPTY = {
  name: '',
  price: '',
  category: '',
  description: '',
  isVeg: true,
  isAvailable: true,
  isBestseller: false,
  soldCount: '',
  imageUrl: '',
}

/** Ek restaurant ke menu mein item add karta hai (image Storage mein). */
export default function MenuItemForm({ restaurantId, restaurantName }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!form.name.trim() || !form.price || !form.category.trim()) {
      setError('Name, price aur category required hain.')
      return
    }
    if (Number(form.price) <= 0) {
      setError('Price 0 se zyada hona chahiye.')
      return
    }

    setSaving(true)
    try {
      await addMenuItem(restaurantId, {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        description: form.description.trim(),
        isVeg: form.isVeg,
        isAvailable: form.isAvailable,
        isBestseller: form.isBestseller,
        soldCount: form.soldCount === '' ? 0 : Number(form.soldCount),
        imageUrl: form.imageUrl || '',
      })
      setForm(EMPTY)
      setMessage(`"${form.name.trim()}" menu mein add ho gaya! 🎉`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <p className="admin-form__context">
        Menu items <strong>{restaurantName}</strong> ke liye add ho rahe hain
      </p>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="menu-name">Item name *</label>
          <input
            id="menu-name"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="e.g. Hyderabadi Chicken Biryani"
          />
        </div>
        <div className="form-field form-field--small">
          <label htmlFor="menu-price">Price (₹) *</label>
          <input
            id="menu-price"
            type="number"
            min="0"
            value={form.price}
            onChange={(event) => update('price', event.target.value)}
            placeholder="349"
          />
        </div>
        <div className="form-field form-field--small">
          <label htmlFor="menu-category">Category *</label>
          <input
            id="menu-category"
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            placeholder="Biryani"
          />
        </div>
        <div className="form-field form-field--small">
          <label htmlFor="menu-sold-count">Sold count (optional)</label>
          <input
            id="menu-sold-count"
            type="number"
            min="0"
            value={form.soldCount}
            onChange={(event) => update('soldCount', event.target.value)}
            placeholder="e.g. 1250"
          />
        </div>
        <div className="form-field form-field--wide">
          <label htmlFor="menu-description">Description</label>
          <input
            id="menu-description"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Short tasty description…"
          />
        </div>
        <div className="form-toggles form-field--wide">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={form.isVeg}
              onChange={(event) => update('isVeg', event.target.checked)}
            />
            Veg item
          </label>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) => update('isAvailable', event.target.checked)}
            />
            Available hai
          </label>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={form.isBestseller}
              onChange={(event) => update('isBestseller', event.target.checked)}
            />
            ⭐ Bestseller (Home pe dikhega)
          </label>
        </div>
      </div>

      <ImagePicker
        label="Item image"
        options={MENU_IMAGES}
        value={form.imageUrl}
        onChange={(url) => update('imageUrl', url ?? '')}
        emoji="🍳"
      />

      {error ? <p className="form-msg form-msg--error">{error}</p> : null}
      {message ? <p className="form-msg form-msg--success">{message}</p> : null}

      <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
        {saving ? 'Saving…' : 'Add menu item'}
      </button>
    </form>
  )
}
