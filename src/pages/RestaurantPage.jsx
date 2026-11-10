import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import useRestaurant from '../hooks/useRestaurant'
import useMenuItems from '../hooks/useMenuItems'
import MenuItemCard from '../components/MenuItemCard'
import SmartImage from '../components/SmartImage'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { cx, formatPrice } from '../utils/format'

export default function RestaurantPage() {
  const { id } = useParams()
  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurant(id)
  const { items, loading: menuLoading, error: menuError } = useMenuItems(id)

  const categories = useMemo(() => {
    const map = items.reduce((acc, item) => {
      const category = item.category ? String(item.category).trim() : 'Other'
      ;(acc[category] ??= []).push(item)
      return acc
    }, {})
    return Object.entries(map).map(([name, categoryItems]) => ({ name, items: categoryItems }))
  }, [items])

  if (restaurantLoading) return <Loader label="Restaurant load ho raha hai…" />

  if (restaurantError || !restaurant) {
    return (
      <main className="page">
        <EmptyState emoji="🥺" title="Restaurant nahi mila" hint="Ho sakta hai listing delete ho gayi ho.">
          <Link to="/" className="btn btn--primary">Back to home</Link>
        </EmptyState>
      </main>
    )
  }

  const rating = Number(restaurant.rating || 0)

  return (
    <>
      <section className="restaurant-hero">
        <div className="restaurant-hero__banner">
          <SmartImage
            className="restaurant-hero__image"
            src={restaurant.imageUrl}
            alt={restaurant.name}
            emoji="🍽️"
          />
        </div>
        <div className="restaurant-hero__info page">
          <div className="restaurant-hero__title-row">
            <div>
              <h1>{restaurant.name}</h1>
              <p className="restaurant-hero__cuisine">{(restaurant.cuisine ?? []).join(' • ')}</p>
              <p className="restaurant-hero__location">
                📍 {restaurant.location} · ⏱ {restaurant.deliveryTime}
              </p>
            </div>
            <span className={cx('rating-badge rating-badge--big', rating < 4 && 'rating-badge--avg')}>
              ★ {rating.toFixed(1)}
            </span>
          </div>

          <div className="restaurant-hero__meta">
            <span>👥 {formatPrice(restaurant.costForTwo)} for two</span>
            {restaurant.isPureVeg ? <span className="pure-veg-badge">🌱 Pure Veg</span> : null}
          </div>

          {restaurant.offer ? (
            <div className="restaurant-hero__offer">🏷️ {restaurant.offer}</div>
          ) : null}
        </div>
      </section>

      <main className="page">
        <Link to="/" className="back-link">← Back to all restaurants</Link>

        {menuLoading ? (
          <Loader label="Menu load ho raha hai…" />
        ) : menuError ? (
          <EmptyState emoji="🚨" title="Menu load nahi hua" hint={menuError.message} />
        ) : categories.length === 0 ? (
          <EmptyState
            emoji="📖"
            title="Menu abhi khali hai"
            hint="Admin panel se is restaurant ke menu items add karo."
          />
        ) : (
          <div className="menu">
            <div className="menu__header">
              <h2>Menu</h2>
              <span className="muted-text">{items.length} items</span>
            </div>

            {categories.map(({ name, items: categoryItems }) => (
              <section key={name} className="menu-category">
                <h3>{name} ({categoryItems.length})</h3>
                <div className="menu-category__items">
                  {categoryItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={{ ...item, restaurantName: restaurant.name }}
                      restaurantId={restaurant.id}
                      restaurantName={restaurant.name}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
