import { useState } from 'react'
import SmartImage from './SmartImage'
import { cx } from '../utils/format'

/**
 * Image choose karne ka simple UI — koi upload nahi.
 * Bundled images (`public/images/`) mein se ek click mein choose karo,
 * ya koi bhi image URL/path type karo.
 */
export default function ImagePicker({ label = 'Image', options = [], value, onChange, emoji = '🍽️' }) {
  const [draft, setDraft] = useState('')
  const current = value ?? ''

  function commit(next) {
    onChange(next)
    setDraft('')
  }

  return (
    <div className="image-picker">
      <span className="image-picker__label">{label}</span>

      <div className="image-picker__row">
        <input
          className="image-picker__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && draft.trim()) {
              event.preventDefault()
              commit(draft.trim())
            }
          }}
          placeholder="/images/restaurants/biryani.jpg ya https://…"
          aria-label={`${label} URL or path`}
        />
        <button
          type="button"
          className="btn btn--outline btn--small"
          onClick={() => draft.trim() && commit(draft.trim())}
          disabled={!draft.trim()}
        >
          Use
        </button>
      </div>

      {options.length > 0 ? (
        <>
          <p className="image-picker__hint">ya neeche se choose karo:</p>
          <div className="image-picker__gallery">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cx(
                  'image-picker__thumb',
                  current === option.value && 'image-picker__thumb--selected',
                )}
                onClick={() => commit(option.value)}
                title={option.label}
                aria-pressed={current === option.value}
              >
                <SmartImage src={option.value} alt={option.label} emoji={emoji} />
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className="image-picker__preview">
        <SmartImage
          className="image-picker__preview-img"
          src={current}
          alt="Selected preview"
          emoji={emoji}
        />
        <div className="image-picker__preview-side">
          <p className="muted-text">
            {current ? <code>{current}</code> : 'Koi image select nahi hui'}
          </p>
          {current ? (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => onChange('')}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
