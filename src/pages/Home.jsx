import { useMemo, useState } from 'react'
import { useRestaurants } from '../hooks/useRestaurants'
import SearchBar from '../components/SearchBar'
import RestaurantCard from '../components/RestaurantCard'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { SORT_OPTIONS } from '../constants'
import { cx, parseDeliveryMinutes } from '../utils/format'

export default function Home() {
  const { restaurants, loading, error } = useRestaurants()
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('All')
  const [sort, setSort] = useState('relevance')
  const [pureVegOnly, setPureVegOnly] = useState(false)
  const [ratedOnly, setRatedOnly] = useState(false)
  const [fastOnly, setFastOnly] = useState(false)
  const [offersOnly, setOffersOnly] = useState(false)

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
