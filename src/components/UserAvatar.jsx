import { useEffect, useState } from 'react'
import { cx } from '../utils/format'

function initialsOf(user) {
  const name = user?.displayName?.trim()
  if (name) {
    const parts = name.split(/\s+/)
    return `${parts[0][0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase()
  }
  return (user?.email?.[0] ?? '?').toUpperCase()
}

/** Google photo dikhata hai; load fail ho toh initials wala fallback. */
export default function UserAvatar({ user, size = 'md' }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [user?.photoURL])

  const className = cx('avatar', size === 'lg' && 'avatar--lg')

  if (!user?.photoURL || failed) {
    return (
      <span className={cx(className, 'avatar--fallback')} aria-hidden="true">
        {initialsOf(user)}
      </span>
    )
  }

  return (
    <img
      className={className}
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
