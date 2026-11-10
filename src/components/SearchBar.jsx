import { CUISINES } from '../constants'
import { cx } from '../utils/format'

/** Hero search + cuisine chips. Fully controlled — state Home ke paas rehti hai. */
export default function SearchBar({ query, onQueryChange, cuisine, onCuisineChange }) {
  return (
    <div className="search-bar">
      <div className="search-bar__box">
        <span className="search-bar__icon" aria-hidden="true">🔍</span>
        <input
          className="search-bar__input"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search for restaurants, cuisines or a dish…"
          aria-label="Search restaurants"
        />
        {query ? (
          <button
            type="button"
            className="search-bar__clear"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="cuisine-chips" role="group" aria-label="Filter by cuisine">
        {CUISINES.map((option) => (
          <button
            key={option}
            type="button"
            className={cx('chip', cuisine === option && 'chip--active')}
            onClick={() => onCuisineChange(option)}
            aria-pressed={cuisine === option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
