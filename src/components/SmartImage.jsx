import { useState } from 'react'
import { PLACEHOLDER_EMOJIS } from '../constants'
import { cx } from '../utils/format'

/**
 * Image fail ho (broken URL / missing) toh gradient + emoji placeholder.
 * `failedSrc` track karta hai taaki src change hone par dobara try ho.
 */
export default function SmartImage({ src, alt = '', emoji, className }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const broken = Boolean(src) && failedSrc === src

  if (!src || broken) {
    const fallbackEmoji = emoji ?? PLACEHOLDER_EMOJIS[Math.abs(hashString(alt)) % PLACEHOLDER_EMOJIS.length]
    return (
      <div className={cx('smart-image smart-image--fallback', className)} role="img" aria-label={alt}>
        <span>{fallbackEmoji}</span>
      </div>
    )
  }

  return (
    <img
      className={cx('smart-image', className)}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
