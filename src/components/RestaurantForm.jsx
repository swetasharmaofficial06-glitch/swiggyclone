import { useState } from 'react'
import ImagePicker from './ImagePicker'
import { createRestaurant } from '../services/restaurantService'
import { CUISINES } from '../constants'
import { RESTAURANT_IMAGES } from '../data/sampleImages'

const EMPTY = {
  name: '',
  location: '',
  cuisine: '',
  rating: '4.0',
  costForTwo: '',
  deliveryTime: '',
  offer: '',
  isPureVeg: false,
  imageUrl: '',
}

export default function RestaurantForm() {
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

    if (!form.name.trim() || !form.location.trim()) {
      setError('Name aur location required hain.')
      return
    }

    setSaving(true)
    try {
      await createRestaurant({
        name: form.name.trim(),
        location: form.location.trim(),
        cuisine: form.cuisine
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        rating: Math.min(5, Math.max(0, Number(form.rating) || 0)),
        costForTwo: Math.max(0, Number(form.costForTwo) || 0),
        deliveryTime: form.deliveryTime.trim() || '30-40 min',
        offer: form.offer.trim(),
        isPureVeg: form.isPureVeg,
        imageUrl: form.imageUrl || '',
      })
      setForm(EMPTY)
      setMessage('Restaurant add ho gaya! 🎉')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="restaurant-name">Name *</label>
          <input
            id="restaurant-name"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="e.g. Biryani Bhavan"
          />
        </div>
        <div className="form-field">
          <label htmlFor="restaurant-location">Location *</label>
          <input
            id="restaurant-location"
            value={form.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder="e.g. Indiranagar, Bengaluru"
          />
        </div>
        <div className="form-field">
          <label htmlFor="restaurant-cuisine">Cuisines (comma separated)</label>
          <input
            id="restaurant-cuisine"
            list="cuisine-suggestions"
            value={form.cuisine}
            onChange={(event) => update('cuisine', event.target.value)}
            placeholder="Biryani, North Indian"
          />
          <datalist id="cuisine-suggestions">
            {CUISINES.filter((value) => value !== 'All').map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </div>
        <div className="form-field form-field--small">
          <label htmlFor="restaurant-rating">Rating (0–5)</label>
          <input
            id="restaurant-rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={(event) => update('rating', event.target.value)}
          />
        </div>
        <div className="form-field form-field--small">
          <label htmlFor="restaurant-cost">Cost for two (₹)</label>
          <input
            id="restaurant-cost"
            type="number"
            min="0"
            value={form.costForTwo}
            onChange={(event) => update('costForTwo', event.target.value)}
            placeholder="450"
          />
        </div>
        <div className="form-field form-field--small">
          <label htmlFor="restaurant-time">Delivery time</label>
          <input
            id="restaurant-time"
            value={form.deliveryTime}
            onChange={(event) => update('deliveryTime', event.target.value)}
            placeholder="30-40 min"
          />
        </div>
        <div className="form-field form-field--small">
          <label htmlFor="restaurant-offer">Offer (optional)</label>
          <input
            id="restaurant-offer"
            value={form.offer}
            onChange={(event) => update('offer', event.target.value)}
            placeholder="₹125 OFF above ₹299"
          />
        </div>
        <label className="form-checkbox form-field--wide">
          <input
            type="checkbox"
            checked={form.isPureVeg}
            onChange={(event) => update('isPureVeg', event.target.checked)}
          />
          Pure Veg restaurant hai
        </label>
      </div>

      <ImagePicker
        label="Cover image"
        options={RESTAURANT_IMAGES}
        value={form.imageUrl}
        onChange={(url) => update('imageUrl', url ?? '')}
      />

      {error ? <p className="form-msg form-msg--error">{error}</p> : null}
      {message ? <p className="form-msg form-msg--success">{message}</p> : null}

      <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
        {saving ? 'Saving…' : 'Add restaurant'}
      </button>
    </form>
  )
}
