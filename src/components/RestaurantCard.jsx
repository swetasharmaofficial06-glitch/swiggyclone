import { Link } from 'react-router-dom'
import SmartImage from './SmartImage'
import { cx, formatPrice, parseDeliveryMinutes } from '../utils/format'

export default function RestaurantCard({ restaurant }) {
  const rating = Number(restaurant.rating || 0)
  const cuisines = (restaurant.cuisine ?? []).join(', ')
  const isFast = parseDeliveryMinutes(restaurant.deliveryTime) <= 30

  return (
    <Link to={`/restaurant/${restaurant.id}`} className="restaurant-card">
      <div className="restaurant-card__media">
        <SmartImage
          className="restaurant-card__image"
          src={restaurant.imageUrl}
          alt={restaurant.name}
          emoji="🍽️"
        />
        {restaurant.offer ? (
          <div className="restaurant-card__offer">
            <span className="restaurant-card__offer-tag">OFFER</span>
            <span>{restaurant.offer}</span>
          </div>
        ) : null}
        {isFast ? <span className="restaurant-card__fast">⚡ Fast delivery</span> : null}
      </div>

      <div className="restaurant-card__body">
        <div className="restaurant-card__title-row">
          <h3>{restaurant.name}</h3>
          <span className={cx('rating-badge', rating < 4 && 'rating-badge--avg')}>
            ★ {rating.toFixed(1)}
          </span>
        </div>
        <p className="restaurant-card__cuisines">{cuisines || 'Multi-cuisine'}</p>
        <div className="restaurant-card__meta">
          <span>⏱ {restaurant.deliveryTime || '30-40 min'}</span>
          <span>•</span>
          <span>{formatPrice(restaurant.costForTwo)} for two</span>
        </div>
        <p className="restaurant-card__location">📍 {restaurant.location}</p>
        {restaurant.isPureVeg ? <span className="pure-veg-badge">🌱 Pure Veg</span> : null}
      </div>
    </Link>
  )
}
