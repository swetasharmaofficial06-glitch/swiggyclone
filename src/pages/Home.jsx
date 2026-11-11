import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRestaurants } from '../hooks/useRestaurants'
import { useBestsellers } from '../hooks/useBestsellers'
import SearchBar from '../components/SearchBar'
import RestaurantCard from '../components/RestaurantCard'
import SmartImage from '../components/SmartImage'
import { VegBadge } from '../components/MenuItemCard'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { SORT_OPTIONS } from '../constants'
import { cx, formatPrice, formatSoldCount, parseDeliveryMinutes } from '../utils/format'

export default function Home() {
  const { restaurants, loading, error } = useRestaurants()
  const { items: bestsellers } = useBestsellers()
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('All')
  const [sort, setSort] = useState('relevance')
  const [pureVegOnly, setPureVegOnly] = useState(false)
  const [ratedOnly, setRatedOnly] = useState(false)
  const [fastOnly, setFastOnly] = useState(false)
  const [offersOnly, setOffersOnly] = useState(false)

  /** Bestseller card par restaurant ka naam dikhane ke liye id → restaurant map. */
  const restaurantById = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])),
    [restaurants],
  )

  const visible = useMemo(() => {
    let list = [...restaurants]
    const q = query.trim().toLowerCase()

    if (q) {
      list = list.filter(
        (restaurant) =>
          restaurant.name?.toLowerCase().includes(q) ||
          restaurant.location?.toLowerCase().includes(q) ||
          (restaurant.cuisine ?? []).some((value) => value.toLowerCase().includes(q)),
      )
    }
    if (cuisine !== 'All') {
      list = list.filter((restaurant) => (restaurant.cuisine ?? []).includes(cuisine))
    }
    if (pureVegOnly) list = list.filter((restaurant) => restaurant.isPureVeg)
    if (ratedOnly) list = list.filter((restaurant) => Number(restaurant.rating || 0) >= 4)
    if (fastOnly) list = list.filter((restaurant) => parseDeliveryMinutes(restaurant.deliveryTime) <= 30)
    if (offersOnly) list = list.filter((restaurant) => Boolean(restaurant.offer))

    const comparators = {
      relevance: () => 0,
      rating: (a, b) => Number(b.rating || 0) - Number(a.rating || 0),
      deliveryTime: (a, b) => parseDeliveryMinutes(a.deliveryTime) - parseDeliveryMinutes(b.deliveryTime),
      costLow: (a, b) => Number(a.costForTwo || 0) - Number(b.costForTwo || 0),
      costHigh: (a, b) => Number(b.costForTwo || 0) - Number(a.costForTwo || 0),
    }
    return list.sort(comparators[sort] ?? comparators.relevance)
  }, [restaurants, query, cuisine, sort, pureVegOnly, ratedOnly, fastOnly, offersOnly])

  function clearFilters() {
    setQuery('')
    setCuisine('All')
    setPureVegOnly(false)
    setRatedOnly(false)
    setFastOnly(false)
    setOffersOnly(false)
    setSort('relevance')
  }

  const hasActiveFilters = Boolean(query) || cuisine !== 'All' || pureVegOnly || ratedOnly || fastOnly || offersOnly

  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <p className="hero__eyebrow">🍔 Welcome to</p>
          <h1>Foodie Hub</h1>
          <p className="hero__subtitle">
            Order food &amp; groceries from your favourite restaurants — delivered fast, right at
            your doorstep.
          </p>

          <SearchBar
            query={query}
            onQueryChange={setQuery}
            cuisine={cuisine}
            onCuisineChange={setCuisine}
          />
        </div>
      </section>

      <main className="page">
        <div className="offer-strip">
          <div className="offer-card offer-card--orange">
            <span className="offer-card__emoji">🏷️</span>
            <div>
              <strong>50% OFF</strong>
              <p>On your first order</p>
            </div>
          </div>
          <div className="offer-card offer-card--green">
            <span className="offer-card__emoji">🚴</span>
            <div>
              <strong>FREE delivery</strong>
              <p>On orders above ₹499</p>
            </div>
          </div>
          <div className="offer-card offer-card--purple">
            <span className="offer-card__emoji">⚡</span>
            <div>
              <strong>30 min delivery</strong>
              <p>From top-rated places</p>
            </div>
          </div>
        </div>

        {bestsellers.length > 0 ? (
          <section className="bestsellers" aria-labelledby="bestsellers-heading">
            <div className="bestsellers__head">
              <div>
                <h2 id="bestsellers-heading">🔥 Most Sold Items</h2>
                <p>Sabse popular dishes — seedha top restaurants se</p>
              </div>
            </div>

            <div className="bestsellers__track">
              {bestsellers.map((item) => {
                const restaurant = restaurantById.get(item.restaurantId)
                const sold = Number(item.soldCount || 0)

                return (
                  <Link
                    key={`${item.restaurantId}-${item.id}`}
                    to={`/restaurant/${item.restaurantId}`}
                    className="bestseller-card"
                  >
                    <div className="bestseller-card__media">
                      <SmartImage
                        className="bestseller-card__image"
                        src={item.imageUrl}
                        alt={item.name}
                        emoji="🍽️"
                      />
                      <span className="bestseller-card__badge">
                        {sold > 0 ? `🔥 ${formatSoldCount(sold)} sold` : '⭐ Bestseller'}
                      </span>
                    </div>

                    <div className="bestseller-card__body">
                      <div className="bestseller-card__name-row">
                        <VegBadge isVeg={Boolean(item.isVeg)} />
                        <h3>{item.name}</h3>
                      </div>
                      <p className="bestseller-card__restaurant">
                        {restaurant?.name || 'Restaurant'}
                      </p>
                      <p className="bestseller-card__price">{formatPrice(item.price)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ) : null}

        <div className="filter-row">
          <div className="filter-row__group">
            <button
              type="button"
              className={cx('filter-chip', pureVegOnly && 'filter-chip--active')}
              onClick={() => setPureVegOnly((value) => !value)}
              aria-pressed={pureVegOnly}
            >
              🌱 Pure Veg
            </button>
            <button
              type="button"
              className={cx('filter-chip', ratedOnly && 'filter-chip--active')}
              onClick={() => setRatedOnly((value) => !value)}
              aria-pressed={ratedOnly}
            >
              ★ Rated 4.0+
            </button>
            <button
              type="button"
              className={cx('filter-chip', fastOnly && 'filter-chip--active')}
              onClick={() => setFastOnly((value) => !value)}
              aria-pressed={fastOnly}
            >
              ⚡ Fast Delivery
            </button>
            <button
              type="button"
              className={cx('filter-chip', offersOnly && 'filter-chip--active')}
              onClick={() => setOffersOnly((value) => !value)}
              aria-pressed={offersOnly}
            >
              🏷️ Great Offers
            </button>
          </div>

          <div className="filter-row__group">
            <span className="filter-row__count">
              {visible.length} restaurant{visible.length === 1 ? '' : 's'}
            </span>
            <select
              className="sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort restaurants"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Loader label="Restaurants load ho rahe hain…" />
        ) : error ? (
          <EmptyState
            emoji="🚨"
            title="Restaurants load nahi ho paaye"
            hint={error.message}
          >
            <p className="muted-text">
              Check karo: <code>.env</code> setup hai? Firestore enable hai? Steps README mein hain.
            </p>
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="Kuch nahi mila"
            hint="Filters thode change karo, ya Admin panel se sample data load karo."
          >
            {hasActiveFilters ? (
              <button type="button" className="btn btn--primary" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </EmptyState>
        ) : (
          <div className="restaurant-grid">
            {visible.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
