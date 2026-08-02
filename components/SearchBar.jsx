import { useEffect, useRef, useState } from 'react'
import { searchCity } from '../services/weatherApi'

const DEBOUNCE_DELAY = 350

function formatCityLabel(city) {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ')
}

export default function SearchBar({
  onSelectCity,
  onDropdownVisibilityChange,
}) {
  const [query, setQuery] = useState('')
  const [cities, setCities] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const suppressNextSearchRef = useRef(false)

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setCities([])
      setIsLoading(false)
      setIsOpen(false)
      return undefined
    }

    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false
      setIsLoading(false)
      setIsOpen(false)
      return undefined
    }

    let ignoreResults = false
    setIsLoading(true)

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchCity(trimmedQuery)

        if (!ignoreResults) {
          setCities(results)
          setIsOpen(true)
        }
      } catch {
        if (!ignoreResults) {
          setCities([])
          setIsOpen(true)
        }
      } finally {
        if (!ignoreResults) {
          setIsLoading(false)
        }
      }
    }, DEBOUNCE_DELAY)

    return () => {
      ignoreResults = true
      window.clearTimeout(timeoutId)
    }
  }, [query])

  function handleSelectCity(city) {
    suppressNextSearchRef.current = true
    setQuery(formatCityLabel(city))
    setCities([])
    setIsOpen(false)
    onSelectCity(city)
  }

  function handleQueryChange(event) {
    setQuery(event.target.value)
  }

  const shouldShowDropdown = isOpen && query.trim()

  useEffect(() => {
    onDropdownVisibilityChange?.(Boolean(shouldShowDropdown))
  }, [onDropdownVisibilityChange, shouldShowDropdown])

  return (
    <div className="search-bar">
      <label className="search-bar__label" htmlFor="city-search">
        Search for a city
      </label>
      <div className="search-bar__field">
        <input
          id="city-search"
          className="search-bar__input"
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true)
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 150)
          }}
          placeholder="Type a city name"
          autoComplete="off"
        />
        {isLoading ? <span className="search-bar__status">Searching…</span> : null}
        {shouldShowDropdown && cities.length > 0 ? (
          <div className="search-bar__dropdown" role="listbox" aria-label="City suggestions">
            {cities.map((city) => (
              <button
                key={city.id}
                type="button"
                className="search-bar__option"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelectCity(city)}
              >
                <strong>{city.name}</strong>
                <span>{[city.admin1, city.country].filter(Boolean).join(', ')}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
